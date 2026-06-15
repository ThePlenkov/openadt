#!/usr/bin/env python3
"""
Rebuild the review scores analysis notebook from the CSV data.
This script executes the notebook and saves the output.
"""

import subprocess
import sys
from pathlib import Path

def main():
    notebook_path = Path(__file__).parent.parent / ".act" / ".review_scores_analysis.ipynb"
    
    if not notebook_path.exists():
        print(f"Error: Notebook not found at {notebook_path}")
        sys.exit(1)
    
    print(f"Rebuilding notebook: {notebook_path}")
    
    # Use nbconvert to execute the notebook
    try:
        result = subprocess.run(
            [
                "jupyter",
                "nbconvert",
                "--to",
                "notebook",
                "--execute",
                "--inplace",
                str(notebook_path)
            ],
            capture_output=True,
            text=True
        )
    except FileNotFoundError:
        print(f"Error: 'jupyter' command not found. Please install Jupyter:")
        print(f"  pip install jupyter nbconvert")
        sys.exit(1)
    
    if result.returncode != 0:
        print(f"Error executing notebook:")
        print(result.stderr)
        sys.exit(1)
    
    print("Notebook rebuilt successfully")
    print(result.stdout)

if __name__ == "__main__":
    main()
