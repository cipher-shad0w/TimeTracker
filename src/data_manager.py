import pandas as pd
import numpy as np
import re
import os
from datetime import datetime, timedelta, date
from typing import List, Dict, Optional, Union, Tuple
import calendar


class TimeDataManager:
    def __init__(self, csv_path):
        """
        Initialisiert den TimeDataManager mit der angegebenen CSV-Datei.
        
        Args:
            csv_path (str): Pfad zur CSV-Datei mit den Zeiterfassungsdaten
        """
        self.csv_path = csv_path
        self.raw_data = None  # Ursprüngliche Daten ohne Transformationen
        self.data = self._load_data()
        
        # Verfügbare Listen für Filter
        self.team_members = self._get_unique_values('Teammitglied')
        self.customers = self._get_unique_values('Kunden')
        self.projects = self._get_unique_values('Auftrag')
        self.project_types = self._get_unique_values('Projekte')  # Art der Projekte wie "Finanzbuchführung"
        self.years = self._get_available_years()
        self.months = list(range(1, 13))  # 1-12 Monate
        
    def _load_data(self) -> pd.DataFrame:
        """
        Lädt die Daten aus der CSV-Datei und bereitet sie für die Analyse vor.
        
        Returns:
            pd.DataFrame: Aufbereiteter DataFrame mit Zeitdaten
        """
        try:
            # Daten laden
            df = pd.read_csv(self.csv_path)
            self.raw_data = df.copy()  # Speichere eine Kopie der Rohdaten
            
            # Start- und End-Datum als Datetime konvertieren
            df['Start Date'] = pd.to_datetime(df['Start Date'], format='%d.%m.%Y', errors='coerce')
            df['End Date'] = pd.to_datetime(df['End Date'], format='%d.%m.%Y', errors='coerce')
            
            # Extrahiere Jahr und Monat für einfache Filterung
            df['Year'] = df['Start Date'].dt.year
            df['Month'] = df['Start Date'].dt.month
            df['Month_Name'] = df['Start Date'].dt.strftime('%B')  # Monatsname
            df['Week'] = df['Start Date'].dt.isocalendar().week
            df['Day'] = df['Start Date'].dt.day
            df['Day_Name'] = df['Start Date'].dt.strftime('%A')  # Wochentagsname
            
            # Konvertiere Dauer in Minuten und Dezimal-Stunden
            df['Minutes'] = df['Dauer'].apply(self._convert_time_to_minutes)
            df['Hours'] = df['Minutes'] / 60  # Minuten in Stunden umrechnen
            
            # Konvertiere Boolean-Wert für Abrechnung
            df['Abgerechnet'] = df['Abgerechnet'].map(lambda x: x if pd.isna(x) else str(x).upper() == 'TRUE')
            
            # Extrahiere das Auftragsjahr aus der Auftragsnummer, wenn möglich
            df['Auftragsjahr'] = df['Auftrag'].apply(self._extract_year_from_project)
            
            # Extrahiere Datum aus Notiz, falls vorhanden
            df['Note_Date'] = df['Notiz'].apply(self._extract_date_from_note)
            
            return df
            
        except Exception as e:
            print(f"Fehler beim Laden der CSV-Datei: {e}")
            return pd.DataFrame()
    
    def _extract_date_from_note(self, note):
        """
        Extrahiert ein Datum aus einer Notiz, wenn verfügbar.
        
        Args:
            note (str): Die Notiz, aus der das Datum extrahiert werden soll
            
        Returns:
            datetime: Das gefundene Datum oder None
        """
        if not isinstance(note, str):
            return None
        
        # Suche nach deutschem Datumsformat (DD.MM.YYYY)
        date_pattern = r'(\d{2}\.\d{2}\.20\d{2})'
        match = re.search(date_pattern, note)
        
        if match:
            date_str = match.group(1)
            try:
                return pd.to_datetime(date_str, format='%d.%m.%Y')
            except:
                return None
        return None
    
    def _extract_year_from_project(self, project_id):
        """
        Extrahiert das Jahr aus einer Projektnummer, wenn es im Format YYYY vorhanden ist.
        
        Args:
            project_id (str): Die Projekt-ID
            
        Returns:
            int: Das extrahierte Jahr oder None
        """
        if not isinstance(project_id, str):
            return None
            
        # Suche nach einem vierstelligen Jahr
        year_pattern = r'20(\d{2})'
        match = re.search(year_pattern, project_id)
        
        if match:
            try:
                full_year = int(f"20{match.group(1)}")
                if 2000 <= full_year <= 2100:  # Plausibilitätscheck
                    return full_year
            except:
                pass
        return None
    
    def _convert_time_to_minutes(self, time_str):
        """
        Konvertiert einen Zeitstring im Format "1h 32m 00s" in Minuten.
        
        Args:
            time_str (str): Der Zeitstring
            
        Returns:
            float: Die Zeit in Minuten
        """
        if not isinstance(time_str, str):
            return 0
            
        # Extrahiere Stunden, Minuten und Sekunden
        pattern = r"(\d+)h\s+(\d+)m\s+(\d+)s"
        match = re.search(pattern, time_str)
        
        if match:
            hours = int(match.group(1))
            minutes = int(match.group(2))
            seconds = int(match.group(3))
            return hours * 60 + minutes + seconds / 60
        return 0
    
    def _get_unique_values(self, column_name):
        """
        Gibt alle eindeutigen Werte einer Spalte zurück.
        
        Args:
            column_name (str): Name der Spalte
            
        Returns:
            list: Liste der eindeutigen Werte
        """
        if self.data is not None and not self.data.empty and column_name in self.data.columns:
            return sorted(self.data[column_name].unique().tolist())
        return []
    
    def _get_available_years(self):
        """
        Ermittelt alle Jahre, für die Daten vorhanden sind.
        
        Returns:
            list: Liste der verfügbaren Jahre
        """
        if self.data is not None and not self.data.empty and 'Year' in self.data.columns:
            return sorted(self.data['Year'].unique().tolist())
        return []
    
    def reload_data(self):
        """
        Lädt die Daten aus der CSV-Datei neu.
        
        Returns:
            bool: True wenn erfolgreich, False wenn ein Fehler auftritt
        """
        try:
            self.data = self._load_data()
            
            # Aktualisiere die Listen für Filter
            self.team_members = self._get_unique_values('Teammitglied')
            self.customers = self._get_unique_values('Kunden')
            self.projects = self._get_unique_values('Auftrag')
            self.project_types = self._get_unique_values('Projekte')
            self.years = self._get_available_years()
            
            return True
        except Exception as e:
            print(f"Fehler beim Neuladen der Daten: {e}")
            return False
    
    def save_data(self, csv_path=None):
        """
        Speichert die aktuellen Daten in eine CSV-Datei.
        
        Args:
            csv_path (str, optional): Pfad zur Ziel-CSV-Datei. Wenn nicht angegeben, wird der ursprüngliche Pfad verwendet.
            
        Returns:
            bool: True wenn erfolgreich, False wenn ein Fehler auftritt
        """
        if csv_path is None:
            csv_path = self.csv_path
            
        try:
            # Konvertiere Datetime-Objekte zurück in das richtige Format
            temp_df = self.raw_data.copy()
            temp_df.to_csv(csv_path, index=False)
            return True
        except Exception as e:
            print(f"Fehler beim Speichern der Daten: {e}")
            return False
            
    # ---------- Filter-Funktionen ----------
    
    def filter_by_customer(self, customer_name=None):
        """
        Filtert die Daten nach Kundenname.
        
        Args:
            customer_name (str, optional): Name des Kunden
            
        Returns:
            pd.DataFrame: Gefilterte Daten
        """
        if customer_name and customer_name != "Alle Mandanten":
            return self.data[self.data['Kunden'] == customer_name]
        return self.data
        
    def filter_by_project(self, project_id=None):
        """
        Filtert die Daten nach Projektnummer.
        
        Args:
            project_id (str, optional): ID des Projekts
            
        Returns:
            pd.DataFrame: Gefilterte Daten
        """
        if project_id and project_id not in ["Alle Projekte", "Keine Projekte vorhanden"]:
            return self.data[self.data['Auftrag'] == project_id]
        return self.data
    
    def filter_by_year(self, year=None):
        """
        Filtert die Daten nach Jahr.
        
        Args:
            year (int, optional): Jahr
            
        Returns:
            pd.DataFrame: Gefilterte Daten
        """
        if year:
            year = int(year) if isinstance(year, str) else year
            return self.data[self.data['Year'] == year]
        return self.data
        
    def filter_by_month(self, month=None):
        """
        Filtert die Daten nach Monat.
        
        Args:
            month (int, optional): Monat (1-12)
            
        Returns:
            pd.DataFrame: Gefilterte Daten
        """
        if month:
            month = int(month) if isinstance(month, str) else month
            return self.data[self.data['Month'] == month]
        return self.data
    
    def filter_by_team_member(self, team_member=None):
        """
        Filtert die Daten nach Teammitglied.
        
        Args:
            team_member (str, optional): Name des Teammitglieds
            
        Returns:
            pd.DataFrame: Gefilterte Daten
        """
        if team_member and team_member != "Alle Teammitglieder":
            return self.data[self.data['Teammitglied'] == team_member]
        return self.data
    
    def filter_by_project_type(self, project_type=None):
        """
        Filtert die Daten nach Projekttyp (z.B. "Finanzbuchführung").
        
        Args:
            project_type (str, optional): Typ des Projekts
            
        Returns:
            pd.DataFrame: Gefilterte Daten
        """
        if project_type and project_type != "Alle Projekttypen":
            return self.data[self.data['Projekte'] == project_type]
        return self.data
    
    def filter_by_invoiced(self, invoiced=None):
        """
        Filtert die Daten nach Abrechnungsstatus.
        
        Args:
            invoiced (bool, optional): True für abgerechnete, False für nicht abgerechnete Einträge
            
        Returns:
            pd.DataFrame: Gefilterte Daten
        """
        if invoiced is not None:
            return self.data[self.data['Abgerechnet'] == invoiced]
        return self.data
    
    def filter_by_date_range(self, start_date=None, end_date=None):
        """
        Filtert die Daten nach einem Datumsbereich.
        
        Args:
            start_date (str oder datetime, optional): Startdatum
            end_date (str oder datetime, optional): Enddatum
            
        Returns:
            pd.DataFrame: Gefilterte Daten
        """
        filtered_data = self.data.copy()
        
        if start_date:
            if isinstance(start_date, str):
                start_date = pd.to_datetime(start_date)
            filtered_data = filtered_data[filtered_data['Start Date'] >= start_date]
            
        if end_date:
            if isinstance(end_date, str):
                end_date = pd.to_datetime(end_date)
            filtered_data = filtered_data[filtered_data['End Date'] <= end_date]
            
        return filtered_data
    
    def filter_by_time_period(self, period):
        """
        Filtert die Daten nach einem vordefinierten Zeitraum.
        
        Args:
            period (str): Einer der folgenden Werte:
                - "today": Heutiger Tag
                - "yesterday": Gestriger Tag
                - "current_week": Aktuelle Woche
                - "last_week": Letzte Woche
                - "current_month": Aktueller Monat
                - "last_month": Letzter Monat
                - "current_quarter": Aktuelles Quartal
                - "last_quarter": Letztes Quartal
                - "current_year": Aktuelles Jahr
                - "last_year": Letztes Jahr
                - "all_time": Alle Zeiten
                
        Returns:
            pd.DataFrame: Gefilterte Daten
        """
        today = datetime.now()
        
        if period == "today":
            start_date = today.replace(hour=0, minute=0, second=0, microsecond=0)
            return self.filter_by_date_range(start_date=start_date, end_date=today)
            
        elif period == "yesterday":
            yesterday = today - timedelta(days=1)
            start_date = yesterday.replace(hour=0, minute=0, second=0, microsecond=0)
            end_date = yesterday.replace(hour=23, minute=59, second=59, microsecond=999999)
            return self.filter_by_date_range(start_date=start_date, end_date=end_date)
            
        elif period == "current_week":
            # Montag dieser Woche
            start_date = today - timedelta(days=today.weekday())
            start_date = start_date.replace(hour=0, minute=0, second=0, microsecond=0)
            return self.filter_by_date_range(start_date=start_date)
            
        elif period == "last_week":
            # Montag letzte Woche
            start_date = today - timedelta(days=today.weekday() + 7)
            start_date = start_date.replace(hour=0, minute=0, second=0, microsecond=0)
            # Sonntag letzte Woche
            end_date = start_date + timedelta(days=6)
            end_date = end_date.replace(hour=23, minute=59, second=59, microsecond=999999)
            return self.filter_by_date_range(start_date=start_date, end_date=end_date)
            
        elif period == "current_month":
            start_date = today.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            return self.filter_by_date_range(start_date=start_date)
            
        elif period == "last_month":
            last_month = today.month - 1 if today.month > 1 else 12
            last_month_year = today.year if today.month > 1 else today.year - 1
            
            start_date = datetime(last_month_year, last_month, 1)
            # Letzter Tag des letzten Monats
            last_day = calendar.monthrange(last_month_year, last_month)[1]
            end_date = datetime(last_month_year, last_month, last_day, 23, 59, 59, 999999)
            
            return self.filter_by_date_range(start_date=start_date, end_date=end_date)
            
        elif period == "current_quarter":
            current_quarter = (today.month - 1) // 3 + 1
            start_month = (current_quarter - 1) * 3 + 1
            start_date = datetime(today.year, start_month, 1)
            return self.filter_by_date_range(start_date=start_date)
            
        elif period == "last_quarter":
            last_quarter = ((today.month - 1) // 3)
            if last_quarter == 0:
                last_quarter = 4
                last_quarter_year = today.year - 1
            else:
                last_quarter_year = today.year
                
            start_month = (last_quarter - 1) * 3 + 1
            end_month = start_month + 2
            
            start_date = datetime(last_quarter_year, start_month, 1)
            last_day = calendar.monthrange(last_quarter_year, end_month)[1]
            end_date = datetime(last_quarter_year, end_month, last_day, 23, 59, 59, 999999)
            
            return self.filter_by_date_range(start_date=start_date, end_date=end_date)
            
        elif period == "current_year":
            start_date = datetime(today.year, 1, 1)
            return self.filter_by_date_range(start_date=start_date)
            
        elif period == "last_year":
            start_date = datetime(today.year - 1, 1, 1)
            end_date = datetime(today.year - 1, 12, 31, 23, 59, 59, 999999)
            return self.filter_by_date_range(start_date=start_date, end_date=end_date)
            
        else:  # "all_time" oder ungültige Eingabe
            return self.data
    
    def filter_data(self, customer=None, project_id=None, team_member=None, 
                   project_type=None, year=None, month=None, invoiced=None, 
                   period=None, start_date=None, end_date=None):
        """
        Kombinierter Filter für alle Attribute.
        
        Args:
            customer (str, optional): Name des Kunden
            project_id (str, optional): ID des Projekts
            team_member (str, optional): Name des Teammitglieds
            project_type (str, optional): Typ des Projekts
            year (int, optional): Jahr
            month (int, optional): Monat
            invoiced (bool, optional): Abrechnungsstatus
            period (str, optional): Vordefinierter Zeitraum
            start_date (datetime, optional): Benutzerdefiniertes Startdatum
            end_date (datetime, optional): Benutzerdefiniertes Enddatum
            
        Returns:
            pd.DataFrame: Gefilterte Daten
        """
        filtered_data = self.data.copy()
        
        if period:
            filtered_data = self.filter_by_time_period(period)
        else:
            if start_date or end_date:
                filtered_data = self.filter_by_date_range(start_date, end_date)
        
        if customer:
            filtered_data = filtered_data[filtered_data['Kunden'] == customer]
            
        if project_id:
            filtered_data = filtered_data[filtered_data['Auftrag'] == project_id]
            
        if team_member:
            filtered_data = filtered_data[filtered_data['Teammitglied'] == team_member]
            
        if project_type:
            filtered_data = filtered_data[filtered_data['Projekte'] == project_type]
            
        if year:
            filtered_data = filtered_data[filtered_data['Year'] == int(year)]
            
        if month:
            filtered_data = filtered_data[filtered_data['Month'] == int(month)]
            
        if invoiced is not None:
            filtered_data = filtered_data[filtered_data['Abgerechnet'] == invoiced]
            
        return filtered_data
    
    # ---------- Analyse-Funktionen ----------
    
    def get_time_by_day(self, customer=None, project_id=None, team_member=None):
        """
        Gibt die aufgewendete Zeit pro Tag zurück.
        
        Args:
            customer (str, optional): Name des Kunden für die Filterung
            project_id (str, optional): ID des Projekts für die Filterung
            team_member (str, optional): Name des Teammitglieds für die Filterung
            
        Returns:
            pd.DataFrame: DataFrame mit Datumsangaben und Summe der Minuten
        """
        filtered_data = self.filter_data(customer=customer, project_id=project_id, team_member=team_member)
            
        if filtered_data.empty:
            return pd.DataFrame(columns=['Date', 'Minutes', 'Hours'])
            
        # Nach Datum gruppieren und Zeiten summieren
        daily_time = filtered_data.groupby('Start Date').agg({
            'Minutes': 'sum',
            'Hours': 'sum'
        }).reset_index()
        
        # Nach Datum sortieren
        daily_time = daily_time.sort_values('Start Date')
        
        return daily_time
    
    def get_time_by_week(self, customer=None, project_id=None, team_member=None, year=None):
        """
        Gibt die aufgewendete Zeit pro Woche zurück.
        
        Args:
            customer (str, optional): Name des Kunden für die Filterung
            project_id (str, optional): ID des Projekts für die Filterung
            team_member (str, optional): Name des Teammitglieds für die Filterung
            year (int, optional): Jahr für die Filterung
            
        Returns:
            pd.DataFrame: DataFrame mit Kalenderwoche und Summe der Minuten
        """
        filtered_data = self.filter_data(customer=customer, project_id=project_id, 
                                        team_member=team_member, year=year)
            
        if filtered_data.empty:
            return pd.DataFrame(columns=['Year', 'Week', 'Minutes', 'Hours'])
            
        # Nach Jahr und Kalenderwoche gruppieren und Zeiten summieren
        weekly_time = filtered_data.groupby(['Year', 'Week']).agg({
            'Minutes': 'sum',
            'Hours': 'sum'
        }).reset_index()
        
        # Sortieren
        weekly_time = weekly_time.sort_values(['Year', 'Week'])
        
        return weekly_time
    
    def get_time_by_month(self, customer=None, project_id=None, team_member=None, year=None):
        """
        Gibt die aufgewendete Zeit pro Monat zurück.
        
        Args:
            customer (str, optional): Name des Kunden für die Filterung
            project_id (str, optional): ID des Projekts für die Filterung
            team_member (str, optional): Name des Teammitglieds für die Filterung
            year (int, optional): Jahr für die Filterung
            
        Returns:
            pd.DataFrame: DataFrame mit Monat und Summe der Minuten
        """
        filtered_data = self.filter_data(customer=customer, project_id=project_id, 
                                        team_member=team_member, year=year)
            
        if filtered_data.empty:
            return pd.DataFrame(columns=['Year', 'Month', 'Month_Name', 'Minutes', 'Hours'])
            
        # Nach Jahr und Monat gruppieren und Zeiten summieren
        monthly_time = filtered_data.groupby(['Year', 'Month']).agg({
            'Minutes': 'sum',
            'Hours': 'sum',
            'Month_Name': 'first'  # Nimm den Monatsnamen des ersten Eintrags
        }).reset_index()
        
        # Sortieren
        monthly_time = monthly_time.sort_values(['Year', 'Month'])
        
        return monthly_time
    
    def get_time_by_customer(self, team_member=None, year=None, month=None, 
                            project_type=None, invoiced=None):
        """
        Gibt die aufgewendete Zeit pro Kunde zurück.
        
        Args:
            team_member (str, optional): Name des Teammitglieds für die Filterung
            year (int, optional): Jahr für die Filterung
            month (int, optional): Monat für die Filterung
            project_type (str, optional): Typ des Projekts für die Filterung
            invoiced (bool, optional): Abrechnungsstatus für die Filterung
            
        Returns:
            pd.DataFrame: DataFrame mit Kunden und Summe der Minuten
        """
        filtered_data = self.filter_data(team_member=team_member, year=year, month=month, 
                                        project_type=project_type, invoiced=invoiced)
            
        if filtered_data.empty:
            return pd.DataFrame(columns=['Kunden', 'Minutes', 'Hours'])
            
        # Nach Kunden gruppieren und Zeiten summieren
        customer_time = filtered_data.groupby('Kunden').agg({
            'Minutes': 'sum',
            'Hours': 'sum'
        }).reset_index()
        
        # Nach Zeit absteigend sortieren
        customer_time = customer_time.sort_values('Minutes', ascending=False)
        
        return customer_time
    
    def get_time_by_project(self, customer=None, team_member=None, year=None, 
                           month=None, project_type=None, invoiced=None):
        """
        Gibt die aufgewendete Zeit pro Projekt zurück.
        
        Args:
            customer (str, optional): Name des Kunden für die Filterung
            team_member (str, optional): Name des Teammitglieds für die Filterung
            year (int, optional): Jahr für die Filterung
            month (int, optional): Monat für die Filterung
            project_type (str, optional): Typ des Projekts für die Filterung
            invoiced (bool, optional): Abrechnungsstatus für die Filterung
            
        Returns:
            pd.DataFrame: DataFrame mit Projekten und Summe der Minuten
        """
        filtered_data = self.filter_data(customer=customer, team_member=team_member, 
                                        year=year, month=month, project_type=project_type, 
                                        invoiced=invoiced)
            
        if filtered_data.empty:
            return pd.DataFrame(columns=['Auftrag', 'Minutes', 'Hours'])
            
        # Nach Projekten gruppieren und Zeiten summieren
        project_time = filtered_data.groupby('Auftrag').agg({
            'Minutes': 'sum',
            'Hours': 'sum'
        }).reset_index()
        
        # Nach Zeit absteigend sortieren
        project_time = project_time.sort_values('Minutes', ascending=False)
        
        return project_time
    
    def get_time_by_project_type(self, customer=None, team_member=None, year=None, 
                               month=None, invoiced=None):
        """
        Gibt die aufgewendete Zeit pro Projekttyp (z.B. "Finanzbuchführung") zurück.
        
        Args:
            customer (str, optional): Name des Kunden für die Filterung
            team_member (str, optional): Name des Teammitglieds für die Filterung
            year (int, optional): Jahr für die Filterung
            month (int, optional): Monat für die Filterung
            invoiced (bool, optional): Abrechnungsstatus für die Filterung
            
        Returns:
            pd.DataFrame: DataFrame mit Projekttypen und Summe der Minuten
        """
        filtered_data = self.filter_data(customer=customer, team_member=team_member, 
                                        year=year, month=month, invoiced=invoiced)
            
        if filtered_data.empty:
            return pd.DataFrame(columns=['Projekte', 'Minutes', 'Hours'])
            
        # Nach Projekttyp gruppieren und Zeiten summieren
        project_type_time = filtered_data.groupby('Projekte').agg({
            'Minutes': 'sum',
            'Hours': 'sum'
        }).reset_index()
        
        # Nach Zeit absteigend sortieren
        project_type_time = project_type_time.sort_values('Minutes', ascending=False)
        
        return project_type_time
    
    def get_time_by_team_member(self, customer=None, project_id=None, year=None, 
                              month=None, project_type=None, invoiced=None):
        """
        Gibt die aufgewendete Zeit pro Teammitglied zurück.
        
        Args:
            customer (str, optional): Name des Kunden für die Filterung
            project_id (str, optional): ID des Projekts für die Filterung
            year (int, optional): Jahr für die Filterung
            month (int, optional): Monat für die Filterung
            project_type (str, optional): Typ des Projekts für die Filterung
            invoiced (bool, optional): Abrechnungsstatus für die Filterung
            
        Returns:
            pd.DataFrame: DataFrame mit Teammitglied und Summe der Minuten
        """
        filtered_data = self.filter_data(customer=customer, project_id=project_id, 
                                        year=year, month=month, project_type=project_type, 
                                        invoiced=invoiced)
            
        if filtered_data.empty:
            return pd.DataFrame(columns=['Teammitglied', 'Minutes', 'Hours'])
            
        # Nach Teammitglied gruppieren und Zeiten summieren
        team_member_time = filtered_data.groupby('Teammitglied').agg({
            'Minutes': 'sum',
            'Hours': 'sum'
        }).reset_index()
        
        # Nach Zeit absteigend sortieren
        team_member_time = team_member_time.sort_values('Minutes', ascending=False)
        
        return team_member_time
    
    def get_time_by_invoiced_status(self, customer=None, project_id=None, team_member=None, 
                                  year=None, month=None, project_type=None):
        """
        Gibt die aufgewendete Zeit gruppiert nach Abrechnungsstatus zurück.
        
        Args:
            customer (str, optional): Name des Kunden für die Filterung
            project_id (str, optional): ID des Projekts für die Filterung
            team_member (str, optional): Name des Teammitglieds für die Filterung
            year (int, optional): Jahr für die Filterung
            month (int, optional): Monat für die Filterung
            project_type (str, optional): Typ des Projekts für die Filterung
            
        Returns:
            pd.DataFrame: DataFrame mit Abrechnungsstatus und Summe der Minuten
        """
        filtered_data = self.filter_data(customer=customer, project_id=project_id, 
                                        team_member=team_member, year=year, 
                                        month=month, project_type=project_type)
            
        if filtered_data.empty:
            return pd.DataFrame(columns=['Abgerechnet', 'Minutes', 'Hours'])
            
        # Nach Abrechnungsstatus gruppieren und Zeiten summieren
        invoiced_time = filtered_data.groupby('Abgerechnet').agg({
            'Minutes': 'sum',
            'Hours': 'sum'
        }).reset_index()
        
        return invoiced_time
    
    def get_total_time(self, customer=None, project_id=None, team_member=None, 
                     year=None, month=None, project_type=None, invoiced=None):
        """
        Gibt die Gesamtzeit für die gefilterten Daten zurück.
        
        Args:
            customer (str, optional): Name des Kunden für die Filterung
            project_id (str, optional): ID des Projekts für die Filterung
            team_member (str, optional): Name des Teammitglieds für die Filterung
            year (int, optional): Jahr für die Filterung
            month (int, optional): Monat für die Filterung
            project_type (str, optional): Typ des Projekts für die Filterung
            invoiced (bool, optional): Abrechnungsstatus für die Filterung
            
        Returns:
            tuple: (Gesamtminuten, Gesamtstunden, Anzahl Einträge)
        """
        filtered_data = self.filter_data(customer=customer, project_id=project_id, 
                                        team_member=team_member, year=year, 
                                        month=month, project_type=project_type, 
                                        invoiced=invoiced)
            
        if filtered_data.empty:
            return (0, 0, 0)
            
        total_minutes = filtered_data['Minutes'].sum()
        total_hours = total_minutes / 60
        entry_count = len(filtered_data)
        
        return (total_minutes, total_hours, entry_count)
    
    # ---------- Export-Funktionen ----------
    
    def export_to_csv(self, filtered_data, export_path):
        """
        Exportiert gefilterte Daten in eine CSV-Datei.
        
        Args:
            filtered_data (pd.DataFrame): Die zu exportierenden Daten
            export_path (str): Pfad zur Export-Datei
            
        Returns:
            bool: True wenn erfolgreich, False wenn ein Fehler auftritt
        """
        try:
            filtered_data.to_csv(export_path, index=False)
            return True
        except Exception as e:
            print(f"Fehler beim Export der Daten: {e}")
            return False
    
    def export_to_excel(self, filtered_data, export_path):
        """
        Exportiert gefilterte Daten in eine Excel-Datei.
        
        Args:
            filtered_data (pd.DataFrame): Die zu exportierenden Daten
            export_path (str): Pfad zur Export-Datei
            
        Returns:
            bool: True wenn erfolgreich, False wenn ein Fehler auftritt
        """
        try:
            filtered_data.to_excel(export_path, index=False)
            return True
        except Exception as e:
            print(f"Fehler beim Export der Daten: {e}")
            return False
    
    # ---------- Statistische Funktionen ----------
    
    def get_statistics(self, filtered_data=None):
        """
        Berechnet statistische Kennzahlen für die Daten.
        
        Args:
            filtered_data (pd.DataFrame, optional): Gefilterte Daten oder None für alle Daten
            
        Returns:
            dict: Wörterbuch mit statistischen Kennzahlen
        """
        if filtered_data is None:
            filtered_data = self.data
            
        if filtered_data.empty:
            return {
                'total_entries': 0,
                'total_minutes': 0,
                'total_hours': 0,
                'average_duration_minutes': 0,
                'min_duration_minutes': 0,
                'max_duration_minutes': 0,
                'median_duration_minutes': 0,
                'std_dev_duration_minutes': 0,
                'invoiced_minutes': 0,
                'invoiced_hours': 0,
                'not_invoiced_minutes': 0,
                'not_invoiced_hours': 0,
                'invoiced_percentage': 0,
                'customer_count': 0,
                'project_count': 0,
                'team_member_count': 0,
                'first_entry_date': None,
                'last_entry_date': None,
                'date_range_days': 0
            }
            
        stats = {}
        
        # Grundlegende Kennzahlen
        stats['total_entries'] = len(filtered_data)
        stats['total_minutes'] = filtered_data['Minutes'].sum()
        stats['total_hours'] = stats['total_minutes'] / 60
        
        # Durchschnittliche Dauer
        stats['average_duration_minutes'] = filtered_data['Minutes'].mean()
        stats['min_duration_minutes'] = filtered_data['Minutes'].min()
        stats['max_duration_minutes'] = filtered_data['Minutes'].max()
        stats['median_duration_minutes'] = filtered_data['Minutes'].median()
        stats['std_dev_duration_minutes'] = filtered_data['Minutes'].std()
        
        # Abgerechnete vs. nicht abgerechnete Zeit
        if 'Abgerechnet' in filtered_data.columns:
            invoiced_data = filtered_data[filtered_data['Abgerechnet'] == True]
            stats['invoiced_minutes'] = invoiced_data['Minutes'].sum() if not invoiced_data.empty else 0
            stats['invoiced_hours'] = stats['invoiced_minutes'] / 60
            
            stats['not_invoiced_minutes'] = stats['total_minutes'] - stats['invoiced_minutes']
            stats['not_invoiced_hours'] = stats['not_invoiced_minutes'] / 60
            
            if stats['total_minutes'] > 0:
                stats['invoiced_percentage'] = (stats['invoiced_minutes'] / stats['total_minutes']) * 100
            else:
                stats['invoiced_percentage'] = 0
        
        # Anzahl verschiedener Attribute
        stats['customer_count'] = filtered_data['Kunden'].nunique()
        stats['project_count'] = filtered_data['Auftrag'].nunique()
        stats['team_member_count'] = filtered_data['Teammitglied'].nunique()
        
        # Datumsbereich
        if 'Start Date' in filtered_data.columns:
            stats['first_entry_date'] = filtered_data['Start Date'].min()
            stats['last_entry_date'] = filtered_data['Start Date'].max()
            
            if stats['first_entry_date'] and stats['last_entry_date']:
                stats['date_range_days'] = (stats['last_entry_date'] - stats['first_entry_date']).days + 1
            else:
                stats['date_range_days'] = 0
        
        return stats