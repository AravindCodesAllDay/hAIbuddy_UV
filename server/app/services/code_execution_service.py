# app/services/code_execution_service.py
import asyncio
import tempfile
import os
import logging
from pathlib import Path

logger = logging.getLogger(__name__)


class CodeExecutionService:
    """Service for executing Python and C code safely."""

    EXECUTION_TIMEOUT = 10  # seconds
    MAX_OUTPUT_LENGTH = 5000  # characters

    @staticmethod
    async def execute_python(code: str) -> dict:
        """Execute Python code and return output."""
        try:
            with tempfile.NamedTemporaryFile(
                    mode='w',
                    suffix='.py',
                    delete=False
            ) as tmp_file:
                tmp_file.write(code)
                tmp_file_path = tmp_file.name

            try:
                process = await asyncio.create_subprocess_exec(
                    'python3', tmp_file_path,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE
                )

                try:
                    stdout, stderr = await asyncio.wait_for(
                        process.communicate(),
                        timeout=CodeExecutionService.EXECUTION_TIMEOUT
                    )

                    output = stdout.decode('utf-8', errors='replace')
                    error = stderr.decode('utf-8', errors='replace')

                    # Truncate if too long
                    if len(output) > CodeExecutionService.MAX_OUTPUT_LENGTH:
                        output = output[:CodeExecutionService.MAX_OUTPUT_LENGTH] + "\n... (output truncated)"

                    if len(error) > CodeExecutionService.MAX_OUTPUT_LENGTH:
                        error = error[:CodeExecutionService.MAX_OUTPUT_LENGTH] + "\n... (error truncated)"

                    result = {
                        "success": process.returncode == 0,
                        "output": output if output else error,
                        "return_code": process.returncode
                    }

                    return result

                except asyncio.TimeoutError:
                    process.kill()
                    await process.wait()
                    return {
                        "success": False,
                        "output": f"Execution timed out after {CodeExecutionService.EXECUTION_TIMEOUT} seconds",
                        "return_code": -1
                    }
            finally:
                # Clean up temp file
                try:
                    os.unlink(tmp_file_path)
                except Exception:
                    pass

        except Exception as e:
            logger.error(f"Python execution error: {e}")
            return {
                "success": False,
                "output": f"Execution error: {str(e)}",
                "return_code": -1
            }

    @staticmethod
    async def execute_c(code: str) -> dict:
        """Compile and execute C code and return output."""
        try:
            with tempfile.TemporaryDirectory() as tmp_dir:
                source_path = Path(tmp_dir) / "program.c"
                binary_path = Path(tmp_dir) / "program"

                # Write source code
                source_path.write_text(code)

                # Compile
                compile_process = await asyncio.create_subprocess_exec(
                    'gcc', str(source_path), '-o', str(binary_path),
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE
                )

                compile_stdout, compile_stderr = await compile_process.communicate()

                if compile_process.returncode != 0:
                    error_msg = compile_stderr.decode('utf-8', errors='replace')
                    return {
                        "success": False,
                        "output": f"Compilation error:\n{error_msg}",
                        "return_code": compile_process.returncode
                    }

                # Execute
                try:
                    exec_process = await asyncio.create_subprocess_exec(
                        str(binary_path),
                        stdout=asyncio.subprocess.PIPE,
                        stderr=asyncio.subprocess.PIPE
                    )

                    stdout, stderr = await asyncio.wait_for(
                        exec_process.communicate(),
                        timeout=CodeExecutionService.EXECUTION_TIMEOUT
                    )

                    output = stdout.decode('utf-8', errors='replace')
                    error = stderr.decode('utf-8', errors='replace')

                    # Truncate if too long
                    if len(output) > CodeExecutionService.MAX_OUTPUT_LENGTH:
                        output = output[:CodeExecutionService.MAX_OUTPUT_LENGTH] + "\n... (output truncated)"

                    return {
                        "success": exec_process.returncode == 0,
                        "output": output if output else error,
                        "return_code": exec_process.returncode
                    }

                except asyncio.TimeoutError:
                    exec_process.kill()
                    await exec_process.wait()
                    return {
                        "success": False,
                        "output": f"Execution timed out after {CodeExecutionService.EXECUTION_TIMEOUT} seconds",
                        "return_code": -1
                    }

        except Exception as e:
            logger.error(f"C execution error: {e}")
            return {
                "success": False,
                "output": f"Execution error: {str(e)}",
                "return_code": -1
            }


# app/services/code_challenge_service.py
import logging
from typing import Optional
from ollama import AsyncClient
from app.core.settings import settings
from app.services.init_services import ServiceContainer

logger = logging.getLogger(__name__)

CODING_PROBLEMS = {
    "python": [
        {
            "title": "FizzBuzz",
            "description": "Write a function that prints numbers from 1 to 20. For multiples of 3, print 'Fizz'. For multiples of 5, print 'Buzz'. For multiples of both, print 'FizzBuzz'.",
            "starter_code": "def fizzbuzz():\n    # Your code here\n    pass\n\nfizzbuzz()",
            "difficulty": "easy"
        },
        {
            "title": "Palindrome Checker",
            "description": "Write a function that checks if a given string is a palindrome (reads the same forwards and backwards). Ignore case and spaces.",
            "starter_code": "def is_palindrome(s):\n    # Your code here\n    pass\n\nprint(is_palindrome('A man a plan a canal Panama'))",
            "difficulty": "easy"
        },
        {
            "title": "List Sum",
            "description": "Write a function that takes a list of numbers and returns their sum without using the built-in sum() function.",
            "starter_code": "def list_sum(numbers):\n    # Your code here\n    pass\n\nprint(list_sum([1, 2, 3, 4, 5]))",
            "difficulty": "easy"
        }
    ],
    "c": [
        {
            "title": "Array Sum",
            "description": "Write a C program that calculates the sum of an array of integers.",
            "starter_code": "#include <stdio.h>\n\nint array_sum(int arr[], int size) {\n    // Your code here\n    return 0;\n}\n\nint main() {\n    int numbers[] = {1, 2, 3, 4, 5};\n    int result = array_sum(numbers, 5);\n    printf(\"Sum: %d\\n\", result);\n    return 0;\n}",
            "difficulty": "easy"
        },
        {
            "title": "Factorial",
            "description": "Write a C function to calculate the factorial of a number.",
            "starter_code": "#include <stdio.h>\n\nint factorial(int n) {\n    // Your code here\n    return 0;\n}\n\nint main() {\n    printf(\"Factorial of 5: %d\\n\", factorial(5));\n    return 0;\n}",
            "difficulty": "easy"
        }
    ]
}


class CodeChallengeService:
    """Service for managing coding challenges and evaluation."""

    @staticmethod
    def get_challenge(language: str = "python", difficulty: str = "easy") -> Optional[dict]:
        """Get a random coding challenge."""
        problems = CODING_PROBLEMS.get(language, [])
        problems = [p for p in problems if p["difficulty"] == difficulty]

        if not problems:
            return None

        import random
        return random.choice(problems)

    @staticmethod
    async def evaluate_code(
            code: str,
            language: str,
            problem_description: str,
            expected_output: Optional[str] = None
    ) -> str:
        """Use LLM to evaluate submitted code."""
        try:
            client: AsyncClient = ServiceContainer.llm()

            prompt = f"""You are a coding interview evaluator. Review the following code submission.

Problem: {problem_description}

Language: {language}

Code:
```{language}
{code}
```

Provide brief, constructive feedback covering:
1. Correctness - Does it solve the problem?
2. Code quality - Is it clean and readable?
3. Efficiency - Any performance concerns?

Keep your response conversational and under 150 words. Be encouraging but honest."""

            response = await client.chat(
                model=settings.OLLAMA_MODEL,
                messages=[
                    {"role": "system", "content": "You are a friendly coding interview evaluator."},
                    {"role": "user", "content": prompt}
                ],
                stream=False
            )

            feedback = response.get("message", {}).get("content", "").strip()
            return feedback or "Code received. Good effort!"

        except Exception as e:
            logger.error(f"Error evaluating code: {e}")
            return "Code received. Unable to provide detailed feedback at the moment."