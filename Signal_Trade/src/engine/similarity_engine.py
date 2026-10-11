"""Module 3 & 4: Động cơ so khớp vector (Similarity Engine & FAISS Search)."""
from pathlib import Path
from typing import Optional, Union, List, Tuple
import numpy as np
import pandas as pd
from loguru import logger
from sklearn.metrics.pairwise import cosine_similarity
import faiss

from src.core.schemas import MatchResult
from src.core.config_loader import SimilarityEngineConfig
from src.data.storage import load_from_parquet


class SimilarityEngine:
    """
    Động cơ so khớp độ tương đồng vector (Cosine Similarity) với cơ sở dữ liệu mẫu hình lịch sử.
    Hỗ trợ 2 backend: FAISS (IndexFlatIP với L2 normalize) và Scikit-Learn.
    """

    def __init__(
        self,
        parquet_path: Optional[Union[str, Path]] = None,
        config: Optional[SimilarityEngineConfig] = None,
        min_similarity: float = 0.85,
        min_neighbors: int = 10,
        consensus_ratio: float = 0.80,
        backend: str = "faiss"
    ):
        if config is not None:
            self.min_similarity = config.min_similarity
            self.min_neighbors = config.min_neighbors
            self.consensus_ratio = config.consensus_ratio
            self.backend = config.backend
        else:
            self.min_similarity = min_similarity
            self.min_neighbors = min_neighbors
            self.consensus_ratio = consensus_ratio
            self.backend = backend

        self.patterns_df: Optional[pd.DataFrame] = None
        self.vectors: Optional[np.ndarray] = None
        self.directions: Optional[np.ndarray] = None
        self.faiss_index: Optional[faiss.IndexFlatIP] = None
        self.dimension: int = 49

        if parquet_path is not None:
            self.load_database(parquet_path)

    def load_database(self, parquet_path: Union[str, Path]):
        """Nạp kho mẫu hình từ file parquet và dựng chỉ mục tìm kiếm."""
        path = Path(parquet_path)
        if not path.exists():
            raise FileNotFoundError(f"Không tìm thấy cơ sở dữ liệu mẫu hình tại: {path.resolve()}")

        df = load_from_parquet(path)
        self.patterns_df = df

        if 'feature_vector' not in df.columns or 'direction' not in df.columns:
            raise KeyError("File parquet cần có đủ cột 'feature_vector' và 'direction'.")

        # Chuyển đổi sang ma trận NumPy float32
        raw_vectors = np.array(df['feature_vector'].tolist(), dtype=np.float32)
        directions = df['direction'].values.astype(np.int32)

        self.build_index(raw_vectors, directions)
        logger.info(f"Đã nạp thành công {len(df)} mẫu hình vào SimilarityEngine (Backend: {self.backend}).")

    def build_index(self, vectors: np.ndarray, directions: np.ndarray):
        """Khởi tạo ma trận vector và chỉ mục FAISS."""
        if len(vectors) != len(directions):
            raise ValueError("Độ dài mảng vector và direction phải bằng nhau.")

        self.vectors = vectors.astype(np.float32)
        self.directions = directions.astype(np.int32)
        self.dimension = vectors.shape[1]

        # Chuẩn hóa L2 cho FAISS IndexFlatIP (Inner Product = Cosine Similarity khi L2 norm = 1)
        vectors_norm = self.vectors.copy()
        faiss.normalize_L2(vectors_norm)

        self.faiss_index = faiss.IndexFlatIP(self.dimension)
        self.faiss_index.add(vectors_norm)

    def find_matches(self, query_vector: np.ndarray) -> MatchResult:
        """
        Tìm kiếm các mẫu hình có Cosine Similarity >= min_similarity.
        Kiểm tra điều kiện:
        1. Số lượng mẫu khớp >= min_neighbors (mặc định 10).
        2. Tỷ lệ đồng thuận hướng đi (Confidence) >= consensus_ratio (mặc định 80%).
        """
        if self.vectors is None or len(self.vectors) == 0:
            logger.warning("Kho mẫu hình rỗng, không thể so khớp.")
            return MatchResult(
                decision="NO_SIGNAL",
                confidence=0.0,
                total_matches=0,
                long_matches=0,
                short_matches=0,
                avg_similarity=0.0,
                matched_indices=[]
            )

        q = np.asarray(query_vector, dtype=np.float32).reshape(1, -1)
        q_norm_val = np.linalg.norm(q)
        if q_norm_val < 1e-6:
            logger.warning("Query vector có độ dài xấp xỉ 0.")
            return MatchResult(
                decision="NO_SIGNAL",
                confidence=0.0,
                total_matches=0,
                long_matches=0,
                short_matches=0,
                avg_similarity=0.0,
                matched_indices=[]
            )

        # Chuẩn hóa L2 query vector
        q_normalized = q / q_norm_val

        matched_indices: List[int] = []
        matched_scores: List[float] = []

        if self.backend == "faiss" and self.faiss_index is not None:
            # Dùng range_search của FAISS
            lims, D, I = self.faiss_index.range_search(q_normalized, thresh=float(self.min_similarity))
            start_idx, end_idx = lims[0], lims[1]
            if end_idx > start_idx:
                matched_indices = I[start_idx:end_idx].tolist()
                matched_scores = D[start_idx:end_idx].tolist()
        else:
            # Backend fallback bằng scikit-learn
            sims = cosine_similarity(q_normalized, self.vectors)[0]
            mask = sims >= self.min_similarity
            matched_indices = np.where(mask)[0].tolist()
            matched_scores = sims[mask].tolist()

        total_matches = len(matched_indices)

        if total_matches == 0:
            return MatchResult(
                decision="NO_SIGNAL",
                confidence=0.0,
                total_matches=0,
                long_matches=0,
                short_matches=0,
                avg_similarity=0.0,
                matched_indices=[]
            )

        avg_similarity = float(np.mean(matched_scores))
        matched_dirs = self.directions[matched_indices]

        long_matches = int(np.sum(matched_dirs == 1))
        short_matches = int(np.sum(matched_dirs == -1))

        conf_long = long_matches / total_matches
        conf_short = short_matches / total_matches

        # Kiểm tra ngưỡng kích hoạt
        if total_matches >= self.min_neighbors and conf_long >= self.consensus_ratio:
            decision = "LONG"
            confidence = float(conf_long)
        elif total_matches >= self.min_neighbors and conf_short >= self.consensus_ratio:
            decision = "SHORT"
            confidence = float(conf_short)
        else:
            decision = "NO_SIGNAL"
            confidence = float(max(conf_long, conf_short))

        return MatchResult(
            decision=decision,
            confidence=round(confidence, 4),
            total_matches=total_matches,
            long_matches=long_matches,
            short_matches=short_matches,
            avg_similarity=round(avg_similarity, 4),
            matched_indices=matched_indices
        )
