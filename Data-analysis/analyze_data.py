import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import os

# Define file path
file_path = r"c:\Users\ahmed\Desktop\hdfc notes\Capstone Project\prob1\Data-analysis\Digital KYC_Reduce Drop-Off_Lift Conversion.xlsx"
output_dir = r"c:\Users\ahmed\Desktop\hdfc notes\Capstone Project\prob1\Data-analysis"

def load_data(path):
    print(f"Loading data from {path}...")
    try:
        # Read first few rows to find header
        df_temp = pd.read_excel(path, header=None)
        
        # Find the row index where 'S.No.' is present
        header_idx = None
        for i, row in df_temp.iterrows():
            if row.astype(str).str.contains('S.No.', case=False).any():
                header_idx = i
                break
        
        if header_idx is not None:
            print(f"Found header at row {header_idx}")
            df = pd.read_excel(path, header=header_idx)
            # Drop columns that are completely empty (like the first one likely)
            df = df.dropna(axis=1, how='all')
            print("Data loaded successfully with correct header.")
            return df
        else:
            print("Could not find header row with 'S.No.'. Loading with default header.")
            return pd.read_excel(path)

    except Exception as e:
        print(f"Error loading data: {e}")
        return None

def perform_eda(df):
    print("\n--- First 20 Rows ---")
    print(df.head(20))
    print("\n--- Columns ---")
    print(df.columns.tolist())
    print("\n--- Info ---")
    print(df.info())
    print("\n--- Describe ---")
    print(df.describe(include='all'))
    print("\n--- Missing Values ---")
    print(df.isnull().sum())

def generate_charts(df, output_folder):
    print("\n--- Generating Charts ---")
    # Identify categorical columns
    cat_cols = df.select_dtypes(include=['object', 'category']).columns
    
    for col in cat_cols:
        plt.figure(figsize=(10, 6))
        # Check unique value count to avoid overcrowding
        if df[col].nunique() > 20:
            print(f"Skipping chart for {col} due to high cardinality ({df[col].nunique()})")
            continue
            
        sns.countplot(y=col, data=df, order=df[col].value_counts().index)
        plt.title(f'Distribution of {col}')
        plt.tight_layout()
        filename = os.path.join(output_folder, f"dist_{col}.png")
        plt.savefig(filename)
        print(f"Saved chart: {filename}")
        plt.close()

    # If there's a numerical target or other numerical columns, we might want histograms
    num_cols = df.select_dtypes(include=['number']).columns
    for col in num_cols:
        plt.figure(figsize=(10, 6))
        sns.histplot(df[col], kde=True)
        plt.title(f'Distribution of {col}')
        plt.tight_layout()
        filename = os.path.join(output_folder, f"dist_{col}.png")
        plt.savefig(filename)
        print(f"Saved chart: {filename}")
        plt.close()

if __name__ == "__main__":
    df = load_data(file_path)
    if df is not None:
        perform_eda(df)
        generate_charts(df, output_dir)
