import pandas as pd

df = pd.read_csv("data/indian_banking_transactions.csv")

df.to_parquet("data/transactions.parquet", index=False)

print("Converted successfully!")