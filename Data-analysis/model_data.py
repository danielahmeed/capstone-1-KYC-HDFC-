import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import os
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
from sklearn.preprocessing import LabelEncoder

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
            df = pd.read_excel(path, header=header_idx)
            df = df.dropna(axis=1, how='all')
            return df
        else:
            return pd.read_excel(path)
    except Exception as e:
        print(f"Error loading data: {e}")
        return None

def preprocess_data(df):
    print("\n--- Preprocessing Data ---")
    
    # Create Target Variable
    # 1 if KYC Successful, 0 otherwise
    df['Is_Successful'] = df['Error'].apply(lambda x: 1 if str(x).strip() == 'KYC Successful' else 0)
    
    print(f"Target Distribution:\n{df['Is_Successful'].value_counts()}")
    
    # Drop irrelevant columns
    drop_cols = ['S.No.', 'Customer ID', 'Error']
    # Check if they exist before dropping
    drop_cols = [c for c in drop_cols if c in df.columns]
    df = df.drop(columns=drop_cols)
    
    # Handle Categorical Variables
    # Stage Name seems important
    if 'Stage Name' in df.columns:
        le = LabelEncoder()
        df['Stage Name'] = le.fit_transform(df['Stage Name'].astype(str))
        print("Encoded 'Stage Name'")
        
    # Handle Missing Values
    df = df.fillna(0) # Simple imputation for now
    
    return df

def train_model(df):
    print("\n--- Training Model ---")
    
    X = df.drop('Is_Successful', axis=1)
    y = df['Is_Successful']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=42)
    
    rf = RandomForestClassifier(n_estimators=100, random_state=42)
    rf.fit(X_train, y_train)
    
    y_pred = rf.predict(X_test)
    
    print("\n--- Model Evaluation ---")
    acc = accuracy_score(y_test, y_pred)
    report = classification_report(y_test, y_pred)
    print(f"Accuracy: {acc}")
    print("\nClassification Report:")
    print(report)
    
    with open(os.path.join(output_dir, "model_results.txt"), "w") as f:
        f.write(f"Accuracy: {acc}\n")
        f.write("\nClassification Report:\n")
        f.write(report)
        f.write("\n\nFeature Importance:\n")
        importances = rf.feature_importances_
        indices = importances.argsort()[::-1]
        for i in indices:
            f.write(f"{X.columns[i]}: {importances[i]}\n")
    
    return rf, X.columns

def plot_feature_importance(model, feature_names, output_folder):
    print("\n--- Plotting Feature Importance ---")
    importances = model.feature_importances_
    indices = importances.argsort()[::-1]
    
    plt.figure(figsize=(10, 6))
    plt.title("Feature Importances")
    plt.bar(range(len(importances)), importances[indices], align="center")
    plt.xticks(range(len(importances)), [feature_names[i] for i in indices], rotation=45, ha='right')
    plt.tight_layout()
    filename = os.path.join(output_folder, "feature_importance.png")
    plt.savefig(filename)
    print(f"Saved feature importance plot: {filename}")

if __name__ == "__main__":
    df = load_data(file_path)
    if df is not None:
        df_processed = preprocess_data(df)
        model, feature_names = train_model(df_processed)
        plot_feature_importance(model, feature_names, output_dir)
