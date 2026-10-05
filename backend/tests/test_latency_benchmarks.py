import time
from backend.app.layers.layer1_privacy import sanitize_pii
from backend.app.layers.layer3_knowledge_base import verify_vendor_remittance

def test_layer1_privacy_latency_benchmark():
    sample_text = (
        "Inbound invoice submission: Contact finance officer MyKad 881020-14-6677, "
        "mobile number 012-3456789. Payment of RM 90,000 to be disbursed today."
    )
    # Warmup
    sanitize_pii(sample_text)
    
    # 50 iterations benchmark
    total_time = 0.0
    iterations = 50
    for _ in range(iterations):
        t0 = time.perf_counter()
        sanitize_pii(sample_text)
        total_time += (time.perf_counter() - t0)
        
    avg_ms = (total_time / iterations) * 1000.0
    assert avg_ms < 5.0, f"Layer 1 exceeded 5ms SLA: {avg_ms:.3f}ms"

def test_layer3_knowledge_base_latency_benchmark():
    # Warmup
    verify_vendor_remittance("Mega Logistics Sdn Bhd", "514012998877", "Maybank")
    
    # 100 iterations benchmark
    total_time = 0.0
    iterations = 100
    for _ in range(iterations):
        t0 = time.perf_counter()
        verify_vendor_remittance("Mega Logistics Sdn Bhd", "514012998877", "Maybank")
        total_time += (time.perf_counter() - t0)
        
    avg_ms = (total_time / iterations) * 1000.0
    assert avg_ms < 2.0, f"Layer 3 exceeded 2ms SLA: {avg_ms:.3f}ms"
