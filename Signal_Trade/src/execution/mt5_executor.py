"""Module 5 (Execution): Thực thi lệnh thị trường tự động trên MetaTrader 5."""
from typing import Dict, Any, Optional
import MetaTrader5 as mt5
from loguru import logger
from src.core.schemas import TradeSignal


class MT5Executor:
    """
    Thực thi vào lệnh Market Order tự động trên MetaTrader 5 Terminal.
    """

    def __init__(self, magic_number: int = 108899, slippage_points: int = 20):
        self.magic_number = magic_number
        self.slippage = slippage_points

    @staticmethod
    def detect_filling_mode(symbol: str) -> int:
        """Tự động phát hiện chế độ khớp lệnh (Order Filling Mode) mà broker hỗ trợ."""
        sym_info = mt5.symbol_info(symbol)
        if sym_info is None:
            return mt5.ORDER_FILLING_IOC

        filling = sym_info.filling_mode
        # Kiểm tra bitwise flags
        if filling & mt5.SYMBOL_FILLING_IOC:
            return mt5.ORDER_FILLING_IOC
        elif filling & mt5.SYMBOL_FILLING_FOK:
            return mt5.ORDER_FILLING_FOK
        else:
            return mt5.ORDER_FILLING_RETURN

    def execute_market_order(self, signal: TradeSignal) -> Dict[str, Any]:
        """
        Gửi lệnh Market Order vào MT5 Terminal theo thông số của TradeSignal.
        """
        symbol = signal.symbol

        if not mt5.terminal_info() or not mt5.terminal_info().connected:
            logger.error("MT5 Terminal chưa kết nối, không thể thực thi lệnh!")
            return {"status": "FAILED", "reason": "MT5_DISCONNECTED"}

        if not mt5.symbol_select(symbol, True):
            logger.error(f"Symbol '{symbol}' không tìm thấy trên sàn!")
            return {"status": "FAILED", "reason": "SYMBOL_NOT_FOUND"}

        tick = mt5.symbol_info_tick(symbol)
        if tick is None:
            logger.error(f"Không lấy được tick giá thời gian thực cho {symbol}!")
            return {"status": "FAILED", "reason": "NO_TICK_AVAILABLE"}

        # Xác định chiều lệnh và giá khớp tức thời
        if signal.direction == "LONG":
            order_type = mt5.ORDER_TYPE_BUY
            price = tick.ask
        elif signal.direction == "SHORT":
            order_type = mt5.ORDER_TYPE_SELL
            price = tick.bid
        else:
            return {"status": "FAILED", "reason": f"INVALID_DIRECTION_{signal.direction}"}

        filling_mode = self.detect_filling_mode(symbol)

        request = {
            "action": mt5.TRADE_ACTION_DEAL,
            "symbol": symbol,
            "volume": float(signal.suggested_lot),
            "type": order_type,
            "price": price,
            "sl": float(signal.stop_loss),
            "tp": float(signal.take_profit),
            "deviation": self.slippage,
            "magic": self.magic_number,
            "comment": f"PatternBot_{signal.direction}",
            "type_time": mt5.ORDER_TIME_GTC,
            "type_filling": filling_mode,
        }

        logger.info(f"Đang gửi lệnh MT5: {signal.direction} {signal.suggested_lot} Lot @ {price:.2f} (SL: {signal.stop_loss}, TP: {signal.take_profit})...")

        result = mt5.order_send(request)

        if result is None:
            err = mt5.last_error()
            logger.error(f"Lỗi khi gọi order_send: {err}")
            return {"status": "FAILED", "reason": str(err)}

        if result.retcode != mt5.TRADE_RETCODE_DONE:
            logger.error(f"Sàn từ chối lệnh! Retcode: {result.retcode} - {result.comment}")
            return {
                "status": "FAILED",
                "retcode": result.retcode,
                "comment": result.comment
            }

        logger.success(
            f"🎉 KHỚP LỆNH THÀNH CÔNG! Ticket #{result.order}, "
            f"Volume: {result.volume}, Khớp tại giá: {result.price:.2f}"
        )
        return {
            "status": "SUCCESS",
            "ticket": result.order,
            "volume": result.volume,
            "price": result.price,
            "retcode": result.retcode
        }
