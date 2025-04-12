import matplotlib.pyplot as plt
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg
import customtkinter as ctk


def create_customer_pie_chart(frame, customer_data):
    """Creates a pie chart showing time per customer"""
    # Clear previous widgets
    for widget in frame.winfo_children():
        widget.destroy()
        
    # Title
    title_label = ctk.CTkLabel(frame, text="Time per Customer", font=("Arial", 14, "bold"))
    title_label.pack(pady=(10, 5))
    
    # Check if data is available
    if customer_data.empty:
        ctk.CTkLabel(frame, text="No data available").pack(pady=50)
        return
        
    # Create the chart
    fig, ax = plt.subplots(figsize=(5, 4), dpi=100)
    ax.pie(
        customer_data['Minutes'], 
        labels=customer_data['Kunden'],
        autopct='%1.1f%%',
        startangle=90,
        wedgeprops={'edgecolor': 'white', 'linewidth': 1}
    )
    ax.axis('equal')  # Ensures the pie chart is circular
    plt.tight_layout()
    
    # Add the chart to the frame
    canvas = FigureCanvasTkAgg(fig, master=frame)
    canvas.draw()
    canvas.get_tk_widget().pack(fill="both", expand=True)


def create_daily_line_chart(frame, daily_data):
    """Creates a line chart showing time per day"""
    # Clear previous widgets
    for widget in frame.winfo_children():
        widget.destroy()
        
    # Title
    title_label = ctk.CTkLabel(frame, text="Time per Day", font=("Arial", 14, "bold"))
    title_label.pack(pady=(10, 5))
    
    # Check if data is available
    if daily_data.empty:
        ctk.CTkLabel(frame, text="No data available").pack(pady=50)
        return
        
    # Create the chart
    fig, ax = plt.subplots(figsize=(5, 4), dpi=100)
    ax.plot(
        daily_data['Date'], 
        daily_data['Minutes'] / 60,  # Convert to hours
        marker='o',
        linestyle='-',
        color='#007acc'
    )
    
    # Formatting
    ax.set_ylabel('Hours')
    ax.set_xlabel('Date')
    ax.grid(True, linestyle='--', alpha=0.7)
    
    # Rotate x-axis labels for better readability
    plt.xticks(rotation=45)
    plt.tight_layout()
    
    # Add the chart to the frame
    canvas = FigureCanvasTkAgg(fig, master=frame)
    canvas.draw()
    canvas.get_tk_widget().pack(fill="both", expand=True)


def create_project_bar_chart(frame, project_data, top_n=10):
    """Creates a bar chart showing time per project"""
    # Clear previous widgets
    for widget in frame.winfo_children():
        widget.destroy()
        
    # Title
    title_label = ctk.CTkLabel(frame, text="Time per Project", font=("Arial", 14, "bold"))
    title_label.pack(pady=(10, 5))
    
    # Check if data is available
    if project_data.empty:
        ctk.CTkLabel(frame, text="No data available").pack(pady=50)
        return
        
    # Limit to top N projects for better readability
    if len(project_data) > top_n:
        project_data = project_data.head(top_n)
        
    # Create the chart
    fig, ax = plt.subplots(figsize=(8, 4), dpi=100)
    bars = ax.barh(
        project_data['Auftrag'], 
        project_data['Minutes'] / 60,  # Convert to hours
        color='#5cb85c'
    )
    
    # Formatting
    ax.set_xlabel('Hours')
    ax.set_title('Top Projects by Time Spent')
    ax.grid(True, axis='x', linestyle='--', alpha=0.7)
    
    # Display values at the end of bars
    for bar in bars:
        width = bar.get_width()
        label_x_pos = width + 0.1
        ax.text(label_x_pos, bar.get_y() + bar.get_height()/2, f'{width:.1f}h',
               va='center')
    
    plt.tight_layout()
    
    # Add the chart to the frame
    canvas = FigureCanvasTkAgg(fig, master=frame)
    canvas.draw()
    canvas.get_tk_widget().pack(fill="both", expand=True)