export function notFoundHandler(req, res) {
  return res.status(404).json({
    success: false,
    message: `Không tìm thấy API ${req.method} ${req.originalUrl}.`,
  })
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error)
  }

  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Dữ liệu tín hiệu không hợp lệ.',
      errors: Object.values(error.errors).map(({ path, message }) => ({ field: path, message })),
    })
  }

  if (error.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: `Giá trị không hợp lệ cho trường ${error.path}.`,
    })
  }

  if (error.code === 11000) {
    return res.status(409).json({
      success: false,
      message: 'Email này đã được đăng ký.',
    })
  }

  if (error instanceof SyntaxError && 'body' in error) {
    return res.status(400).json({
      success: false,
      message: 'JSON gửi lên không hợp lệ.',
    })
  }

  console.error('Lỗi xử lý API:', error)
  return res.status(500).json({
    success: false,
    message: 'Đã xảy ra lỗi máy chủ.',
  })
}
