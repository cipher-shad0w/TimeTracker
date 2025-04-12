import pandas as pd
import re
from datetime import datetime, timedelta


class TimeDataManager:
    def __init__(self, csv_path):
        self.csv_path = csv_path
        self.data = self._load_data()
        self.customers = self._get_unique_customers()
        
    def _load_data(self):
        try:
            df = pd.read_csv(self.csv_path)
            
            # Konvertiere Zeiten zu Minuten für einfachere Berechnungen
            df['Minuten'] = df['Dauer'].apply(self._convert_time_to_minutes)
            
            # Konvertiere Datum zu datetime
            df['Start Date'] = pd.to_datetime(df['Start Date'], format='%d.%m.%Y')
            df['End Date'] = pd.to_datetime(df['End Date'], format='%d.%m.%Y')
            
            return df
        except Exception as e:
            print(f"Fehler beim Laden der CSV-Datei: {e}")
            return pd.DataFrame()
    
    def _convert_time_to_minutes(self, time_str):
        # Extrahiere Stunden, Minuten und Sekunden aus dem Format "1h 32m 00s"
        pattern = r"(\d+)h\s+(\d+)m\s+(\d+)s"
        match = re.search(pattern, time_str)
        
        if match:
            hours = int(match.group(1))
            minutes = int(match.group(2))
            seconds = int(match.group(3))
            return hours * 60 + minutes + seconds / 60
        return 0
    
    def _get_unique_customers(self):
        if self.data is not None and not self.data.empty:
            return self.data['Kunden'].unique().tolist()
        return []
        
    def filter_by_customer(self, customer_name):
        return self.data[self.data['Kunden'] == customer_name]
    
    def get_time_by_day(self, customer_name=None):
        if customer_name:
            filtered_data = self.filter_by_customer(customer_name)
        else:
            filtered_data = self.data
            
        if filtered_data.empty:
            return pd.DataFrame()
            
        # Gruppiere nach Datum und summiere die Minuten
        daily_time = filtered_data.groupby('Start Date')['Minuten'].sum().reset_index()
        return daily_time
    
    def get_time_by_customer(self):
        customer_time = self.data.groupby('Kunden')['Minuten'].sum().reset_index()
        customer_time = customer_time.sort_values('Minuten', ascending=False)
        return customer_time
    
    def get_time_by_project(self, customer_name=None):
        if customer_name:
            filtered_data = self.filter_by_customer(customer_name)
        else:
            filtered_data = self.data
            
        project_time = filtered_data.groupby('Auftrag')['Minuten'].sum().reset_index()
        project_time = project_time.sort_values('Minuten', ascending=False)
        return project_time
        
    def get_total_time(self, customer_name=None):
        if customer_name:
            filtered_data = self.filter_by_customer(customer_name)
            return filtered_data['Minuten'].sum()
        return self.data['Minuten'].sum()
        
    def filter_by_date_range(self, range_option):
        """Filtert die Daten nach einem bestimmten Zeitraum"""
        today = datetime.now()
        
        if range_option == "Letzte Woche":
            start_date = today - timedelta(days=7)
            return self.data[self.data['Start Date'] >= start_date]
        elif range_option == "Letzter Monat":
            start_date = today - timedelta(days=30)
            return self.data[self.data['Start Date'] >= start_date]
        elif range_option == "Letztes Quartal":
            start_date = today - timedelta(days=90)
            return self.data[self.data['Start Date'] >= start_date]
        else:  # "Alle Zeiten"
            return self.data