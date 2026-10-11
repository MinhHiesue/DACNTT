"""Unit tests cho Module 3 & 4: SimilarityEngine."""
import time
from pathlib import Path
import numpy as np
import pytest

from src.engine.similarity_engine import SimilarityEngine
from src.core.schemas import MatchResult


@pytest.fixture
def sample_pattern_data():
    """Tạo bộ dữ liệu mẫu gồm 30 vectors kích thước 49 chiều."""
    np.random.seed(42)
    dim = 49
    n = 30

    # Tạo vector cơ sở
    base_vec_long = np.random.normal(0, 1, dim).astype(np.float32)
    base_vec_short = -base_vec_long # Hướng ngược lại

    vectors = []
    directions = []

    # 15 vectors Long (rất gần base_vec_long)
    for _ in range(15):
        noise = np.random.normal(0, 0.05, dim).astype(np.float32)
        vectors.append(base_vec_long + noise)
        directions.append(1)

    # 15 vectors Short (gần base_vec_short)
    for _ in range(15):
        noise = np.random.normal(0, 0.05, dim).astype(np.float32)
        vectors.append(base_vec_short + noise)
        directions.append(-1)

    return np.array(vectors, dtype=np.float32), np.array(directions, dtype=np.int32), base_vec_long, base_vec_short


def test_perfect_match(sample_pattern_data):
    """Kiểm tra khi query chính một vector trong index thì điểm tương đồng = 1.0."""
    vectors, directions, base_long, _ = sample_pattern_data

    engine = SimilarityEngine(min_similarity=0.85, min_neighbors=5, consensus_ratio=0.80)
    engine.build_index(vectors, directions)

    result = engine.find_matches(vectors[0])
    assert result.total_matches >= 1
    assert result.avg_similarity >= 0.95
    assert 0 in result.matched_indices


def test_long_signal_consensus(sample_pattern_data):
    """Kiểm tra kích hoạt LONG khi các mẫu khớp đồng thuận >= 80% và >= 10 mẫu."""
    vectors, directions, base_long, _ = sample_pattern_data

    engine = SimilarityEngine(min_similarity=0.85, min_neighbors=10, consensus_ratio=0.80)
    engine.build_index(vectors, directions)

    result = engine.find_matches(base_long)
    assert result.decision == "LONG"
    assert result.confidence >= 0.80
    assert result.total_matches >= 10
    assert result.long_matches >= 10


def test_conflict_results_in_no_signal():
    """Kiểm tra khi các mẫu khớp có số lượng Long và Short cân bằng (xung đột) -> NO_SIGNAL."""
    dim = 49
    np.random.seed(10)
    target = np.ones(dim, dtype=np.float32)

    # 5 mẫu Long và 5 mẫu Short giống hệt target
    vectors = [target + np.random.normal(0, 0.01, dim) for _ in range(10)]
    directions = [1] * 5 + [-1] * 5

    engine = SimilarityEngine(min_similarity=0.85, min_neighbors=5, consensus_ratio=0.80)
    engine.build_index(np.array(vectors, dtype=np.float32), np.array(directions, dtype=np.int32))

    result = engine.find_matches(target)
    # Tỷ lệ 5/10 = 50% (< 80%) -> Phải là NO_SIGNAL
    assert result.decision == "NO_SIGNAL"
    assert result.total_matches == 10


def test_faiss_and_sklearn_consistency(sample_pattern_data):
    """Kiểm tra tính nhất quán kết quả giữa 2 backend FAISS và Scikit-Learn."""
    vectors, directions, base_long, _ = sample_pattern_data

    engine_faiss = SimilarityEngine(min_similarity=0.85, min_neighbors=10, consensus_ratio=0.80, backend="faiss")
    engine_faiss.build_index(vectors, directions)
    res_faiss = engine_faiss.find_matches(base_long)

    engine_sklearn = SimilarityEngine(min_similarity=0.85, min_neighbors=10, consensus_ratio=0.80, backend="sklearn")
    engine_sklearn.build_index(vectors, directions)
    res_sklearn = engine_sklearn.find_matches(base_long)

    assert res_faiss.decision == res_sklearn.decision
    assert res_faiss.total_matches == res_sklearn.total_matches
    assert res_faiss.long_matches == res_sklearn.long_matches
    assert res_faiss.short_matches == res_sklearn.short_matches
    assert abs(res_faiss.avg_similarity - res_sklearn.avg_similarity) < 1e-3


def test_benchmark_query_latency_on_real_memory_bank():
    """Đo lường thời gian truy vấn trên kho ký ức thực 9,507 mẫu hình (data/patterns/winning_patterns.parquet)."""
    parquet_path = Path("data/patterns/winning_patterns.parquet")
    if not parquet_path.exists():
        pytest.skip("Chưa có file winning_patterns.parquet")

    engine = SimilarityEngine(parquet_path=parquet_path, min_similarity=0.85, backend="faiss")

    # Vector ngẫu nhiên để query
    sample_q = engine.vectors[0]

    # Benchmark 50 lần query
    times = []
    for _ in range(50):
        t0 = time.perf_counter()
        _ = engine.find_matches(sample_q)
        times.append(time.perf_counter() - t0)

    avg_ms = np.mean(times) * 1000.0
    assert avg_ms < 5.0, f"Query too slow: {avg_ms:.2f} ms"
