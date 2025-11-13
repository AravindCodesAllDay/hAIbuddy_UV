from llama_cpp import Llama

# Set n_gpu_layers to a high number (e.g., 99) to offload all possible layers to the GPU.
# Set verbose=True to see the diagnostic output.
try:
    llm = Llama(
        model_path="../../../models/Llama-3.2-3B-Instruct-Q4_K_M.gguf",
        n_gpu_layers=99,
        verbose=True
    )

    print("\n--- Model Loaded Successfully ---")

    output = llm("What is the capital of France? ", max_tokens=10)
    print("\n--- Inference Output ---")
    print(output['choices'][0]['text'])

except Exception as e:
    print(f"An error occurred: {e}")
    print("\nCheck the output above. If you see 'BLAS = 0', GPU support is NOT active.")
    print("If you see 'BLAS = 1', GPU support IS active.")
