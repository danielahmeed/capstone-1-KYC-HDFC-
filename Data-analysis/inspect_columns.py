import pandas as pd

file_path = r"c:\Users\ahmed\Desktop\hdfc notes\Capstone Project\prob1\Data-analysis\Digital KYC_Reduce Drop-Off_Lift Conversion.xlsx"

def inspect():
    try:
        # Read first few rows to find header
        df_temp = pd.read_excel(file_path, header=None)
        header_idx = None
        for i, row in df_temp.iterrows():
            if row.astype(str).str.contains('S.No.', case=False).any():
                header_idx = i
                break
        
        if header_idx is not None:
            df = pd.read_excel(file_path, header=header_idx)
            df = df.dropna(axis=1, how='all')
            print("--- Columns ---")
            for col in df.columns:
                print(col)
            print("\n--- Target Variable Candidates ---")
            print(f"Column: Error")
            print(df['Error'].value_counts())
        else:
            print("Header not found.")

    except Exception as e:
        print(e)

if __name__ == "__main__":
    inspect()
