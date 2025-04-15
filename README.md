<div align="center" id="top"> 
  &#xa0;
</div>

<h1 align="center">Time Tracker</h1>

<p align="center">
  <img alt="Github top language" src="https://img.shields.io/github/languages/top/cipher-shad0w/time_app?color=56BEB8">
  <img alt="Github language count" src="https://img.shields.io/github/languages/count/cipher-shad0w/time_app?color=56BEB8">
  <img alt="Repository size" src="https://img.shields.io/github/repo-size/cipher-shad0w/time_app?color=56BEB8">
</p>

<p align="center">
  <a href="#about">About</a> &#xa0; | &#xa0; 
  <a href="#features">Features</a> &#xa0; | &#xa0;
  <a href="#technologies">Technologies</a> &#xa0; | &#xa0;
  <a href="#requirements">Requirements</a> &#xa0; | &#xa0;
  <a href="#setup">Setup</a> &#xa0; | &#xa0;
  <a href="#usage">Usage</a> &#xa0; | &#xa0;
  <a href="#structure">Project Structure</a> &#xa0; | &#xa0;
  <a href="#license">License</a>
</p>

---

## <span id="about"></span> :dart: About

Time Tracker is a modern Python desktop application for tracking, analyzing, and visualizing work time. It is designed for professionals and freelancers to manage project efforts, client work, and personal productivity with powerful filtering and reporting features.

---

## <span id="features"></span> :star: Features

- Import and analyze time tracking data from CSV
- Filter by client, project, team member, year, month, and billing status
- Visualize efforts by day, week, month, and year
- Export filtered data to CSV or Excel
- Modern, intuitive UI with CustomTkinter

---

## <span id="technologies"></span> :rocket: Technologies

- **Programming Language:** Python 3.9+
- **Main Libraries:**
  - `pandas`: Data analysis and manipulation
  - `numpy`: Numerical operations
  - `customtkinter`: Modern desktop UI
  - `matplotlib`: Data visualization

---

## <span id="requirements"></span> :white_check_mark: Requirements

- [Git](https://git-scm.com) (for cloning the repository)
- Python 3.9 or higher

---

## <span id="setup"></span> :checkered_flag: Setup

1. **Clone the repository:**
   ```
   git clone https://github.com/cipher-shad0w/time_app.git
   cd time_app
   ```

2. **Install dependencies:**
   ```
   pip install -r requirements.txt
   ```

3. **Prepare your data:**
   - Place your time tracking data as `data/time.csv` (see below for format)

4. **Start the application:**
   ```
   python main.py
   ```

---

## <span id="usage"></span> :computer: Usage

- Use the sidebar to filter by client, project, year, and billing status
- Switch between tabs for year overview, accounting sheet, and team effort
- Export filtered results as CSV or Excel

### Data Format
The CSV file should contain columns like:
- Team member
- Client
- Project
- Project type
- Start Date (DD.MM.YYYY)
- End Date (DD.MM.YYYY)
- Duration (e.g., "1h 30m 0s")
- Billed (TRUE/FALSE)
- Note

---

## <span id="structure"></span> :file_folder: Project Structure

```
LICENSE
main.py
README.md
requirements.txt

data/
    time.csv
src/
    data_manager.py
    tabs.py
    ui.py
tests/
    run_tests.py
    test_charts.py
    test_data_manager.py
    test_integration.py
    test_tabs.py
    test_ui.py
```

- `main.py`: Application entry point
- `src/`: Source code (UI, data manager, tabs)
- `data/`: Place your `time.csv` here
- `tests/`: Automated tests
- `requirements.txt`: Python dependencies

---

## <span id="license"></span> :memo: License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.

---

## Author

Made with :heart: by [Jannis Krija](https://github.com/cipher-shad0w)

&#xa0;

<a href="#top">Back to top</a>