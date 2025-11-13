import torch

if torch.cuda.is_available():
    print("Success! CUDA is available. 👍")

    # Print PyTorch, CUDA, and GPU information
    print(f"PyTorch Version: {torch.__version__}")
    print(
        f"CUDA Version PyTorch was compiled with: {torch.__version__.split('+')[0]}")
    print(f"Number of GPUs: {torch.cuda.device_count()}")
    print(f"GPU Name: {torch.cuda.get_device_name(0)}")

    # Perform a sample computation to confirm functionality
    device = torch.device("cuda")
    x = torch.randn(1000, 1000).to(device)
    y = torch.randn(1000, 1000).to(device)
    z = torch.matmul(x, y)
    print("GPU computation successful! ✅")

else:
    print("CUDA not available. ❌")
