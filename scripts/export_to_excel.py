#!/usr/bin/env python3
"""
Export Sample Parquet Datasets to Formatted Excel (.xlsx) Files
=============================================================
Reads all Parquet datasets used across the lakehouse app and generates:
1. Individual Excel workbooks for each dataset:
   - data/excel/customers.xlsx (500 rows)
   - data/excel/transactions_v1.xlsx (50 rows - Base Schema)
   - data/excel/transactions_v2.xlsx (100 rows - Version Append)
   - data/excel/transactions_mismatch.xlsx (20 rows - Error Schema Mismatch)
2. A single master consolidated Excel workbook:
   - data/excel/sample_banking_datasets_master.xlsx (All 4 sheets in one file)

Styled with corporate banking aesthetics (SC Navy headers, auto-fit columns,
formatted numbers/currencies, and frozen header rows).
"""

from pathlib import Path
import pandas as pd
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

root_dir = Path(__file__).resolve().parent.parent
parquet_dir = root_dir / "data" / "parquet"
excel_dir = root_dir / "data" / "excel"
excel_dir.mkdir(parents=True, exist_ok=True)

files_to_export = [
    {
        "parquet_name": "customers.parquet",
        "excel_name": "customers.xlsx",
        "sheet_title": "Customers (500 Rows)",
        "description": "500 Unique customer profiles for relational JOINs",
    },
    {
        "parquet_name": "transactions_v1.parquet",
        "excel_name": "transactions_v1.xlsx",
        "sheet_title": "Transactions V1 (50 Rows)",
        "description": "Base transactions dataset used to initialize table (Version 1)",
    },
    {
        "parquet_name": "transactions_v2.parquet",
        "excel_name": "transactions_v2.xlsx",
        "sheet_title": "Transactions V2 (100 Rows)",
        "description": "Append batch with matching schema (+100 rows, Version 2)",
    },
    {
        "parquet_name": "transactions_mismatch.parquet",
        "excel_name": "transactions_mismatch.xlsx",
        "sheet_title": "Mismatch Error Test (20 Rows)",
        "description": "Schema mismatch test with extra/missing columns for error rejection",
    },
]

# Styling definitions
HEADER_FILL = PatternFill(start_color="0C2340", end_color="0C2340", fill_type="solid")
HEADER_FONT = Font(name="Segoe UI", size=11, bold=True, color="FFFFFF")
CELL_FONT = Font(name="Segoe UI", size=10, color="0F172A")
ZEBRA_FILL = PatternFill(start_color="F8FAFC", end_color="F8FAFC", fill_type="solid")
BORDER_THIN = Border(
    left=Side(style="thin", color="E2E8F0"),
    right=Side(style="thin", color="E2E8F0"),
    top=Side(style="thin", color="E2E8F0"),
    bottom=Side(style="thin", color="E2E8F0"),
)

CURRENCY_COLS = {"transaction_amount", "account_balance", "emi_amount", "fraud_risk_score"}
INTEGER_COLS = {"credit_score", "transaction_hour"}
DATE_COLS = {"transaction_date"}

def style_worksheet(ws, df: pd.DataFrame):
    # Freeze top row
    ws.freeze_panes = "A2"
    ws.row_dimensions[1].height = 28

    # Style Header Row
    for col_idx in range(1, len(df.columns) + 1):
        cell = ws.cell(row=1, column=col_idx)
        cell.fill = HEADER_FILL
        cell.font = HEADER_FONT
        cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        cell.border = BORDER_THIN

    # Style Data Rows
    for row_idx in range(2, len(df) + 2):
        ws.row_dimensions[row_idx].height = 20
        is_even = (row_idx % 2 == 0)
        
        for col_idx, col_name in enumerate(df.columns, start=1):
            cell = ws.cell(row=row_idx, column=col_idx)
            cell.font = CELL_FONT
            cell.border = BORDER_THIN
            if is_even:
                cell.fill = ZEBRA_FILL

            # Alignment & Number Formatting
            if col_name in CURRENCY_COLS:
                cell.number_format = "#,##0.00"
                cell.alignment = Alignment(horizontal="right", vertical="center")
            elif col_name in INTEGER_COLS:
                cell.number_format = "#,##0"
                cell.alignment = Alignment(horizontal="right", vertical="center")
            elif col_name in DATE_COLS:
                cell.number_format = "yyyy-mm-dd"
                cell.alignment = Alignment(horizontal="center", vertical="center")
            elif isinstance(cell.value, bool):
                cell.alignment = Alignment(horizontal="center", vertical="center")
            else:
                cell.alignment = Alignment(horizontal="left", vertical="center")

    # Auto-adjust column widths
    for col_idx, col_name in enumerate(df.columns, start=1):
        max_len = len(str(col_name))
        for row_idx in range(2, min(len(df) + 2, 100)): # sample up to 100 rows for speed
            val = ws.cell(row=row_idx, column=col_idx).value
            if val is not None:
                max_len = max(max_len, len(str(val)))
        col_letter = get_column_letter(col_idx)
        ws.column_dimensions[col_letter].width = max(max_len + 4, 12)

def generate_excels():
    print("=" * 64)
    print("       PARQUET TO EXCEL DATASET CONVERTER")
    print("=" * 64)
    print(f"Reading from: {parquet_dir.resolve()}")
    print(f"Writing to:   {excel_dir.resolve()}\n")

    # Master writer for combined workbook
    master_excel_path = excel_dir / "sample_banking_datasets_master.xlsx"
    with pd.ExcelWriter(master_excel_path, engine="openpyxl") as master_writer:

        for item in files_to_export:
            p_file = parquet_dir / item["parquet_name"]
            if not p_file.exists():
                print(f"[!] Warning: {p_file} not found, skipping...")
                continue

            # Read Parquet
            df = pd.read_parquet(p_file)
            print(f"[+] Processing {item['parquet_name']} ({len(df)} rows, {len(df.columns)} cols)...")

            # 1. Save Individual Excel Workbook
            indiv_path = excel_dir / item["excel_name"]
            with pd.ExcelWriter(indiv_path, engine="openpyxl") as writer:
                df.to_excel(writer, index=False, sheet_name=item["sheet_title"][:31])
                ws = writer.sheets[item["sheet_title"][:31]]
                style_worksheet(ws, df)
            print(f"    -> Saved individual file: {indiv_path.name}")

            # 2. Add to Master Workbook
            df.to_excel(master_writer, index=False, sheet_name=item["sheet_title"][:31])
            master_ws = master_writer.sheets[item["sheet_title"][:31]]
            style_worksheet(master_ws, df)

    print(f"\n[✓] Saved master consolidated workbook: {master_excel_path.name}")
    print("=" * 64)
    print(" EXCEL GENERATION COMPLETED SUCCESSFULLY")
    print("=" * 64 + "\n")

if __name__ == "__main__":
    generate_excels()

