# author(Somesh Pillay)
# created_on(27.06.2019)
# last_modified_on(09.03.2020)
# version(0.0.11)
# GUI interface to create Products file and issue ZPL commands(using modular programming structure and MySQL database)


# Import necessary packages
from cgitb import text
import tkinter as tk
from tkinter import OptionMenu, StringVar, filedialog, simpledialog, messagebox
from tkcalendar import Calendar, DateEntry
import mysql.connector
import win32
from win32 import win32print
import openpyxl
import os,sys
import json
import time
from datetime import datetime
import shutil
import sqlite3
import win32gui, win32con
# uncomment this for console log
#hide = win32gui.GetForegroundWindow()
#win32gui.ShowWindow(hide , win32con.SW_HIDE)

# Declaring all global variables
config_data = dict()
fields = []
entries = []
tags = []
inputdata = {}
image_path = None
cmd_file = 'sample-print.txt'

def keyup(e):
    # print ('up', e.char)
    pass

def keydown(e):
    # print ('down', e.char)
    pass

def get_number_from_string(n):
    try:
        float_n = float(n)
        return float_n
    except ValueError:
        return 0
    else:
        return 0

def is_int(n):
    try:
        float_n = float(n)
        int_n = int(float_n)
    except ValueError:
        return False
    else:
        return float_n == int_n

def is_float(n):
    try:
        float_n = float(n)
    except ValueError:
        return False
    else:
        return True

def get_template_config(template_name,file_content):
    """Get template config from the template_name passed"""
    template_start = template_name + ' Start'
    template_end = template_name + ' End'

    if(template_start not in file_content or template_end not in file_content):
        return None

    start_index = file_content.index(template_start)
    end_index = file_content.index(template_end)
    template_config = []

    for i in range(start_index+1,end_index):
        # print(file_content[i])
        template_config.append(file_content[i])

    return template_config

def get_current_template():
    """Get default template from config"""

    value = config_data['application_config']['2']['value']

    if(value == ''):
        return None

    return value

def get_printer_templates(file_content):
    """Get templates from printer cmd file"""

    # check if file exists
    if(file_content != None and len(file_content) > 0):
        templates = file_content[0].split(',')

        updated_templates = []
        for template in templates:
            template = template.strip()
            updated_templates.append(template)

        return updated_templates
    else:
        return None

def get_printer_cmds():
    """Read printer cmd file"""
    global cmd_file

    # check if file exists
    if(os.path.exists(cmd_file)):
        with open(cmd_file) as file:
            return file.read().splitlines()
    else:
        return None

def get_config():
    """Get configuration data from config file"""
    global config_data
    with open('config.json') as config:
        config_data = json.load(config)


def update_config():
    """Update configuration data in config file"""
    global config_data
    with open('config.json', 'w') as config:
        json.dump(config_data, config)


def execute_query(query, fetch=0):
    """Execute given query"""
    # print(config_data['mysql']['host'])
    # conn = mysql.connector.connect(host=config_data['mysql']['host'],
    #                                user=config_data['mysql']['user'],
    #                                password=config_data['mysql']['password'],
    #                                db=config_data['mysql']['db'])

    conn = sqlite3.connect(config_data['mysql']['db']+'.db')
                         
    cursor = conn.cursor()
    result = None
    try:
        cursor.execute(query)
        if fetch == 0:
            result = cursor.lastrowid
        elif fetch == 1:
            result = cursor.fetchall()
        elif fetch == 2:  # 2 is for fields, the order changes to alphabetical order in Windows server
            result = []
            for i in cursor.description:
                result.append(i[0])
        cursor.close()
        conn.commit()
    except Exception:
        cursor.close()
    finally:
        conn.close()
        return result


def single_column(result):
    """Concatenates list of values into one when query for single column is performed"""
    result = list(result)
    for i in range(0, len(result)):
        result[i] = result[i][0]
    return result


def refresh_form():
    """Sets entry widgets to default values"""

    global image_path
    image_path = None

    root.bind("<KeyPress>", keydown)
    root.bind("<KeyRelease>", keyup)

    global entries, config
    for entry in entries:
        if entry[0] != 'Net Weight':
            entry[1].delete(0, tk.END)
            entry[1].insert(tk.END, '1')

        if entry[0] != 'RFID Tag':
            entry[1].delete(0, tk.END)
            if (entry[0] not in config_data['fields_for_input']) and (entry[0] not in config_data['always_displayed']):
                entry[1].insert(tk.END, config_data['defaults'][entry[0]])

    # Create list of single column of existing data for tag manipulation
    column_name = ""
    for i in config_data['name_mapping'].items():
        if i[1] == config_data['field_for_tag']:
            column_name = i[0]
    query = 'SELECT {} FROM {}'.format(column_name, config_data['mysql']['table'])
    global tags
    tags = execute_query(query, 1)
    tags = single_column(tags)

    # Create list of single column of Product id - Prashant
    prod_column_name = ""
    for i in config_data['name_mapping'].items():
        if i[0] == config_data['field_for_product']:
            prod_column_name = i[0]
    query = 'SELECT max({}) FROM {}'.format(prod_column_name, config_data['mysql']['table'])
    global productId
    productId = execute_query(query, 1)
    #print(productId[0][0])


class FrameForm:
    """Setup the form with labels and entry widgets"""

    def __init__(self, master):
        self.sv = tk.StringVar()

        #  variables to check for calculating net weight
        self.weight_fields_to_check = ['Gross Weight','Center Stone Weight ','Pear Wt','Stone Weight','Total Stone Weight','Total Diamond Weight','Green Wt','Ruby Wt','Blue Wt','Other St Wt','Moti Wt','Bugguate Wt','Marquise Wt','Oval Wt','Other Dm Wt']
        self.weight_trace = {
            'Gross Weight': tk.StringVar(),
            'Center Stone Weight ': tk.StringVar(),
            'Pear Wt': tk.StringVar(),
            'Stone Weight': tk.StringVar(),
            'Total Stone Weight': tk.StringVar(),
            'Total Diamond Weight': tk.StringVar(),
            'Green Wt': tk.StringVar(),
            'Ruby Wt': tk.StringVar(),
            'Blue Wt': tk.StringVar(),
            'Other St Wt': tk.StringVar(),
            'Moti Wt': tk.StringVar(),
            'Bugguate Wt': tk.StringVar(),
            'Marquise Wt': tk.StringVar(),
            'Oval Wt': tk.StringVar(),
            'Other Dm Wt': tk.StringVar()
        }

        self.outer_frame = tk.Frame(master)
        self.canvas = tk.Canvas(self.outer_frame, borderwidth=0)
        self.inner_frame = tk.Frame(self.canvas, pady=5, padx=5)
        self.vsb = tk.Scrollbar(self.outer_frame, orient='vertical', command=self.canvas.yview)
        self.canvas.configure(yscrollcommand=self.vsb.set)
        self.vsb.pack(side='right', fill='y')
        self.canvas.pack(side='left', fill='both', expand=True)
        self.canvas.create_window((4, 4), window=self.inner_frame, anchor='nw')
        self.outer_frame.pack(side='left', padx=40, pady=20)
        self.inner_frame.bind('<Configure>', lambda event: self.canvas.configure(scrollregion=self.canvas.bbox('all')))
        self.populate_form(self.inner_frame)
        self.inner_frame.update()
        self.canvas.configure(width=self.inner_frame.winfo_width() + 10, height=self.inner_frame.winfo_height() + 10)

    def populate_form(self, master):
        """Populate the form with labels and entry widgets"""
        r = 0
        c = 0
        global entries, config_data
        entries = []
        for i in range(0, len(config_data['ordering'])):
            field = config_data['ordering'][str(i)]
            row = tk.Frame(master)
            lab = tk.Label(row, width=20, text=field, anchor='w')
            ent = tk.Entry(row)

            
            # if auto_generate_design_no == 1 and field == 'Design Number':
            #     ent.configure(state='readonly')

            if field == 'RFID Tag' or field == 'SKU Number' or field == 'Sr No' or field == 'Net Weight' or field == 'Stone Weight':
                ent.configure(state='readonly')
            if field in config_data['fields_for_input'] or field in config_data['always_displayed']:
                row.grid(row=r, column=c, padx=5, pady=5)
                lab.pack(side='left')
                if field == 'Image Name':
                    lab.configure(width=12)
                    open_image = tk.Button(row, text='Browse', command=self.open_image, width=7)
                    open_image.pack(side='left')
                ent.pack(side='right', expand=True, fill='x')
                if c == 0:
                    c += 1
                else:
                    r += 1
                    c = 0
            entries.append((field, ent))
        self.rfid_set_trace()
        self.net_weight_set_trace()
        refresh_form()

    def net_weight_set_trace(self):
        """Set trace for entry responsible to generate Net Weight"""
        global entries

        # add event for when the fields required for calculating net weight and  change
        for entry in entries:

            for field in  self.weight_fields_to_check:

                if entry[0] == field:
                    entry[1].configure(textvariable=self.weight_trace[field])
                    self.weight_trace[field].trace("w", lambda name, index, mode, sv=self.weight_trace[field]: self.set_net_weight())
                    """self.weight_trace[field].trace("w", lambda name, index, mode, sv=self.weight_trace[field]: self.set_stone_weight())"""
                  

    def set_net_weight(self):
        global entries
        # print('set_net_weight')
        temp_grossWeight = self.weight_trace['Gross Weight'].get()
        temp_centerStoneWeight = self.weight_trace['Center Stone Weight '].get()
        temp_stoneWeight = self.weight_trace['Stone Weight'].get()
        temp_totalStoneWeight = self.weight_trace['Total Stone Weight'].get()
        temp_totalDiamondWeight = self.weight_trace['Total Diamond Weight'].get()
        temp_reserved1 = self.weight_trace['Green Wt'].get()
        temp_reserved2 = self.weight_trace['Ruby Wt'].get()
        temp_reserved3 = self.weight_trace['Blue Wt'].get()
        temp_reserved4 = self.weight_trace['Other St Wt'].get()
        temp_reserved5 = self.weight_trace['Moti Wt'].get()
        temp_reserved6 = self.weight_trace['Bugguate Wt'].get()
        temp_reserved7 = self.weight_trace['Marquise Wt'].get()
        temp_kundanWeight = self.weight_trace['Pear Wt'].get()
        temp_kundanPcs = self.weight_trace['Oval Wt'].get()
        temp_meenaWeight = self.weight_trace['Other Dm Wt'].get()
        
        
        

        grossWeight = 0 if temp_grossWeight == '' or (not is_int(temp_grossWeight) and not is_float(temp_grossWeight)) else get_number_from_string(temp_grossWeight)
        centerStoneWeight = 0 if temp_centerStoneWeight == '' or (not is_int(temp_centerStoneWeight) and not is_float(temp_centerStoneWeight)) else get_number_from_string(temp_centerStoneWeight)
        
        stoneWeight = 0 if temp_stoneWeight == '' or (not is_int(temp_stoneWeight) and not is_float(temp_stoneWeight)) else get_number_from_string(temp_stoneWeight)
        totalStoneWeight = 0 if temp_totalStoneWeight == '' or (not is_int(temp_totalStoneWeight) and not is_float(temp_totalStoneWeight)) else get_number_from_string(temp_totalStoneWeight)
        totalDiamondWeight = 0 if temp_totalDiamondWeight == '' or (not is_int(temp_totalDiamondWeight) and not is_float(temp_totalDiamondWeight)) else get_number_from_string(temp_totalDiamondWeight)
        reserved1 = 0 if temp_reserved1 == '' or (not is_int(temp_reserved1) and not is_float(temp_reserved1)) else get_number_from_string(temp_reserved1)
        reserved2 = 0 if temp_reserved2 == '' or (not is_int(temp_reserved2) and not is_float(temp_reserved2)) else get_number_from_string(temp_reserved2)
        reserved3 = 0 if temp_reserved3 == '' or (not is_int(temp_reserved3) and not is_float(temp_reserved3)) else get_number_from_string(temp_reserved3)
        reserved4 = 0 if temp_reserved4 == '' or (not is_int(temp_reserved4) and not is_float(temp_reserved4)) else get_number_from_string(temp_reserved4)
        reserved5 = 0 if temp_reserved5 == '' or (not is_int(temp_reserved5) and not is_float(temp_reserved5)) else get_number_from_string(temp_reserved5)
        reserved6 = 0 if temp_reserved6 == '' or (not is_int(temp_reserved6) and not is_float(temp_reserved6)) else get_number_from_string(temp_reserved6)
        reserved7 = 0 if temp_reserved7 == '' or (not is_int(temp_reserved7) and not is_float(temp_reserved7)) else get_number_from_string(temp_reserved7)
        kundanWeight = 0 if temp_kundanWeight == '' or (not is_int(temp_kundanWeight) and not is_float(temp_kundanWeight)) else get_number_from_string(temp_kundanWeight)
        kundanPcs = 0 if temp_kundanPcs == '' or (not is_int(temp_kundanPcs) and not is_float(temp_kundanPcs)) else get_number_from_string(temp_kundanPcs)
        meenaWeight = 0 if temp_meenaWeight == '' or (not is_int(temp_meenaWeight) and not is_float(temp_meenaWeight)) else get_number_from_string(temp_meenaWeight)
        
        
        
        #netWeight = grossWeight - (centerStoneWeight + kundanWeight + stoneWeight + totalStoneWeight + totalDiamondWeight)
        netWeight = grossWeight - ((reserved1 + reserved2 + reserved3 + reserved4 + reserved5 + reserved6 + reserved7 + kundanWeight + totalDiamondWeight + kundanPcs + meenaWeight ) * 0.2)
        netWeight = round(netWeight,3)
        
        stoneWeight = ((reserved1 + reserved2 + reserved3 + reserved4 + reserved5 + reserved6 + reserved7 + kundanWeight + totalDiamondWeight + kundanPcs + meenaWeight ) * 0.2)
        stoneWeight = round(stoneWeight,3)
        company = (reserved1 + reserved2 + reserved3 + reserved4 + reserved5)
        company = round(company,3)
        totalStoneWeight = ( reserved6 + reserved7 + kundanWeight + totalDiamondWeight + kundanPcs + meenaWeight )
        totalStoneWeight = round (totalStoneWeight,3)
        # print('grossWeight '+str(grossWeight))
        # print('centerStoneWeight '+str(centerStoneWeight))
        # print('kundanWeight '+str(kundanWeight))
        # print('stoneWeight '+str(stoneWeight))
        # print('totalStoneWeight '+str(totalStoneWeight))
        # print('totalDiamondWeight '+str(totalDiamondWeight))
        # print('netWeight '+str(netWeight))

        entries[48][1].configure(state='normal')
        entries[48][1].delete(0, tk.END)
        entries[48][1].insert(tk.END, netWeight)
        entries[48][1].configure(state='readonly')

        entries[44][1].configure(state='normal')
        entries[44][1].delete(0, tk.END)
        entries[44][1].insert(tk.END, stoneWeight)
        entries[44][1].configure(state='readonly')
        entries[38][1].configure(state='normal')
        entries[38][1].delete(0, tk.END)
        entries[38][1].insert(tk.END, totalStoneWeight)
        entries[38][1].configure(state='readonly')
        entries[63][1].configure(state='normal')
        entries[63][1].delete(0, tk.END)
        entries[63][1].insert(tk.END, company)
        entries[63][1].configure(state='readonly')
    # Kalpesh Mali :- Starts
   

    def set_stone_weight(self):
        global entries
        # print('set_stone_weight')
        temp_reserved1 = self.weight_trace['Green Wt'].get()
        temp_reserved2 = self.weight_trace['Ruby Wt'].get()
        temp_reserved3 = self.weight_trace['Blue Wt'].get()
        temp_reserved4 = self.weight_trace['Other St Wt'].get()
        temp_reserved5 = self.weight_trace['Moti Wt'].get()
    
        reserved1 = 0 if temp_reserved1 == '' or (not is_int(temp_reserved1) and not is_float(temp_reserved1)) else get_number_from_string(temp_reserved1)
        reserved2 = 0 if temp_reserved2 == '' or (not is_int(temp_reserved2) and not is_float(temp_reserved2)) else get_number_from_string(temp_reserved2)
        reserved3 = 0 if temp_reserved3 == '' or (not is_int(temp_reserved3) and not is_float(temp_reserved3)) else get_number_from_string(temp_reserved3)
        reserved4 = 0 if temp_reserved4 == '' or (not is_int(temp_reserved4) and not is_float(temp_reserved4)) else get_number_from_string(temp_reserved4)
        reserved5 = 0 if temp_reserved5 == '' or (not is_int(temp_reserved5) and not is_float(temp_reserved5)) else get_number_from_string(temp_reserved5)

        #netWeight = grossWeight - (centerStoneWeight + kundanWeight + stoneWeight + totalStoneWeight + totalDiamondWeight)
        stoneWeight = (reserved1 + reserved2 + reserved3 + reserved4 + reserved5)
        stoneWeight = round(stoneWeight,3)

        
        
        # print(entries,"ll")
    
        entries[32][1].configure(state='normal')
        entries[32][1].delete(0, tk.END)
        entries[32][1].insert(tk.END, stoneWeight)
        entries[32][1].configure(state='readonly')

    # Kalpesh Mali :- Ends

    def rfid_set_trace(self):
        """Set trace for entry responsible to generate RFID Tag"""
        global entries

        #  configure RFID & SKU Number to be same as Design Number field
        auto_generate_design_no = config_data['application_config']['0']['value']

        for entry in entries:
            field_for_tag = config_data['field_for_tag']
            if auto_generate_design_no == 1:
                field_for_tag = 'Design Number'

            if entry[0] == field_for_tag:
                entry[1].configure(textvariable=self.sv)

            self.sv.trace("w", lambda name, index, mode, sv=self.sv: self.rfid_generation())

    def rfid_generation(self):
        """Sets value of RFID tag automatically according to present data"""
        global entries, tags
        auto_generate_design_no = config_data['application_config']['0']['value']

        tag = self.sv.get()
        if tag != "":
            if auto_generate_design_no == 0:
                tag += str(tags.count(tag) + 1)
            entries[1][1].configure(state='normal')
            entries[2][1].configure(state='normal')
            entries[1][1].delete(0, tk.END)
            entries[2][1].delete(0, tk.END)
            entries[1][1].insert(tk.END, tag)
            entries[2][1].insert(tk.END, tag)
            entries[1][1].configure(state='readonly')
            entries[2][1].configure(state='readonly')
            
        else:
            entries[2][1].configure(state='normal')
            entries[1][1].configure(state='normal')
            entries[2][1].delete(0, tk.END)
            entries[1][1].delete(0, tk.END)
            entries[2][1].configure(state='readonly')
            entries[1][1].configure(state='readonly')

    def open_image(self):
        """Puts Image Name into entry widget after letting user choose an image from file dialog"""

        global image_path
        image_name = filedialog.askopenfilename(title='Select Image', filetypes=(("Image files", ["*.jpg", "*.jpeg",
                                                                                                  "*.png"]),
                                                                                 ("all files", "*.*")))
        # print(image_name)
        image_path = image_name
        image_name = image_name.split('/')[-1]
        # print(image_name)
        global entries
        for entry in entries:
            if entry[0] == 'Image Name':
                entry[1].delete(0, tk.END)
                entry[1].insert(tk.END, image_name)


class InsertProduct:
    """Inserts entered product details into database"""

    def __init__(self):
        self.product_details = dict()
        self.fetch_details()
        product_id = self.save_to_db()

    def fetch_details(self):
        """Fetches data entered by the user"""
        global entries
        entered_data = dict()
        for entry in entries:
            if entry[0] in config_data['fields_for_input'] and entry[1].get() == '':
                entered_data[entry[0]] = config_data['defaults'][entry[0]]
                if entry[0] == 'Image Name':
                    entered_data[entry[0]] = entered_data["Design Number"] + ".JPG"
            else:
                entered_data[entry[0]] = entry[1].get()
        # Create dictionary according to database model
        global fields
        for field in fields:
            if field in config_data['name_mapping_database']:
                if config_data['name_mapping_database'][field] in entered_data:
                    self.product_details[field] = entered_data[config_data['name_mapping_database'][field]]
        self.product_details['created_at'] = self.product_details['updated_at'] = datetime.now()

    def check_design_number(self):
        """Checks if entered design number is already present in database"""
        query = "SELECT {} FROM {} WHERE deleted_at is NULL".format('designNumber', config_data['mysql']['table'])
        design_numbers = execute_query(query, 1)
        design_numbers = single_column(design_numbers)
        if self.product_details['designNumber'] not in design_numbers:
            return 0
        else:
            choice = messagebox.askyesno("Warning",
                                         "Design number {} already present.\nDo you want to continue?".format(
                                             self.product_details['designNumber']))
            if choice is True:
                return 0
            else:
                return -1

    def save_to_db(self):
        """Runs query to push data to database"""

        global image_path
        global config_data

        if self.check_design_number() == -1:
                return -1
        if self.product_details.get("rfidTag") != "":  # Prashant - Check if RFID is entered and then only insert        
            query = "INSERT INTO {}(".format(config_data['mysql']['table'])
            for i in self.product_details.keys():
                query += i + ", "
            query += "shop_id) VALUES ("
            for i in self.product_details.values():
                if i != "":
                    try:
                        i = int(str(i))
                        query += str(i) + ", "
                    except ValueError:
                        query += "'" + str(i) + "', "
                else:
                    query += "NULL, "
            query += str(config_data['mysql']['shop_id']) + ")"
            result = execute_query(query)

            if self.product_details.get("imageName") == "":
                image_path = None

            # print(image_path)
            if(image_path != None):
                src_path = image_path
                dst_path = config_data['application_config']['1']['value']

                if(os.path.isfile(src_path) and os.path.isdir(dst_path)):
                    try:
                        if(self.product_details.get("designNumber") != ''):
                            dst_path = dst_path + '/' + self.product_details.get("designNumber") + '.jpg'
                            
                        shutil.copy(src_path, dst_path)
                    except shutil.SameFileError:
                        print('same file, not copied')
                        
                    # print('Copied')
                # else:
                #     print('Not Copied')

            messagebox.showinfo("Success", "Product entry saved with SrNo: {} ".format(result))
            refresh_form()
            return result
        else:  # Prashant
            messagebox.showinfo("Error", "Please enter RFID to save")

class InsertPrintProduct:
    """Inserts entered product details into database"""

    def __init__(self):
        self.product_details = dict()
        self.fetch_details()
        product_id = self.save_to_db()
        if(product_id != None):
            PrintData2([product_id])


    def fetch_details(self):
        """Fetches data entered by the user"""
        global entries
        entered_data = dict()
        for entry in entries:
            if entry[0] in config_data['fields_for_input'] and entry[1].get() == '':
                entered_data[entry[0]] = config_data['defaults'][entry[0]]
                if entry[0] == 'Image Name':
                    entered_data[entry[0]] = entered_data["Design Number"] + ".JPG"
            else:
                entered_data[entry[0]] = entry[1].get()
        # Create dictionary according to database model
        global fields
        for field in fields:
            if field in config_data['name_mapping_database']:
                if config_data['name_mapping_database'][field] in entered_data:
                    self.product_details[field] = entered_data[config_data['name_mapping_database'][field]]
        self.product_details['created_at'] = self.product_details['updated_at'] = datetime.now()

    def check_design_number(self):
        """Checks if entered design number is already present in database"""
        query = "SELECT {} FROM {}".format('designNumber', config_data['mysql']['table'])
        design_numbers = execute_query(query, 1)
        design_numbers = single_column(design_numbers)
        if self.product_details['designNumber'] not in design_numbers:
            return 0
        else:
            choice = messagebox.askyesno("Warning",
                                         "Design number {} already present.\nDo you want to continue?".format(
                                             self.product_details['designNumber']))
            if choice is True:
                return 0
            else:
                return -1

    def save_to_db(self):
        """Runs query to push data to database"""
        if self.check_design_number() == -1:
                return -1
        if self.product_details.get("rfidTag") != "":  # Prashant - Check if RFID is entered and then only insert        
            query = "INSERT INTO {}(".format(config_data['mysql']['table'])
            for i in self.product_details.keys():
                query += i + ", "
            query += "shop_id) VALUES ("
            for i in self.product_details.values():
                if i != "":
                    try:
                        i = int(str(i))
                        query += str(i) + ", "
                    except ValueError:
                        query += "'" + str(i) + "', "
                else:
                    query += "NULL, "
            query += str(config_data['mysql']['shop_id']) + ")"
            result = execute_query(query)
            messagebox.showinfo("Success", "Product entry saved with SrNo: {} ".format(result))
            return result
            # refresh_form()
        else:  # Prashant
            messagebox.showinfo("Error", "Please enter RFID to save")

class EditDefaults:
    """Edit the default values for entries and also choose which fields to display"""

    def __init__(self):
        self.outer_frame = tk.Frame(app.master)
        self.canvas = tk.Canvas(self.outer_frame, borderwidth=0)
        self.inner_frame = tk.Frame(self.canvas, pady=5, padx=5)
        self.vsb = tk.Scrollbar(self.outer_frame, orient='vertical', command=self.canvas.yview)
        self.frame_buttons = tk.Frame(app.master, bg='#bd9e6f')
        self.save = tk.Button(self.frame_buttons, text='SAVE', width=20, height=5, command=self.save_defaults)
        self.check_all = tk.Button(self.frame_buttons, text='CHECK ALL', width=20, height=5, command=self.check_all)
        self.uncheck_all = tk.Button(self.frame_buttons, text='UNCHECK ALL', width=20, height=5,
                                     command=self.uncheck_all)
        self.back = tk.Button(self.frame_buttons, text='BACK', width=20, height=5, command=self.back)
        self.defaults = []
        self.generate_layout()

    def generate_layout(self):
        """Generates layout for this functionality"""
        global app
        app.frame_form.outer_frame.pack_forget()
        app.frame_buttons.frame.pack_forget()
        self.canvas.configure(yscrollcommand=self.vsb.set)
        self.vsb.pack(side='right', fill='y')
        self.canvas.pack(side='left', fill='both', expand=True)
        self.canvas.create_window((4, 4), window=self.inner_frame, anchor='nw')
        self.outer_frame.pack(side='left', padx=40, pady=20)
        self.inner_frame.bind('<Configure>', lambda event: self.canvas.configure(scrollregion=self.canvas.bbox('all')))
        self.populate_form(self.inner_frame)
        self.inner_frame.update()
        self.canvas.configure(width=self.inner_frame.winfo_width() + 10, height=self.inner_frame.winfo_height() + 10)
        self.frame_buttons.pack(side='left', padx=40, pady=20)
        self.save.grid(row=0, pady=10)
        self.check_all.grid(row=1, pady=10)
        self.uncheck_all.grid(row=2, pady=10)
        self.back.grid(row=3, pady=10)

    def populate_form(self, master):
        """Generate labels and entry widgets"""
        r = 0
        c = 0
        global config_data
        for i in range(0, len(config_data['ordering'])):
            field = config_data['ordering'][str(i)]
            row = tk.Frame(master)
            var = tk.IntVar()
            cbx = tk.Checkbutton(row, text="", variable=var)
            lab = tk.Label(row, width=20, text=field, anchor='w')
            ent = tk.Entry(row)
            if field in config_data['fields_for_input']:
                var.set(1)
            if field in config_data['always_displayed']:
                var.set(1)
                cbx.configure(state='disabled')
            if field == 'RFID Tag' or field == 'SKU Number' or field == 'Sr No':
                ent.configure(state='readonly')
            row.grid(row=r, column=c, padx=5, pady=5)
            cbx.pack(side='left')
            lab.pack(side='left')
            ent.pack(side='right', expand=True, fill='x')
            ent.insert(tk.END, config_data['defaults'][field])
            if c == 0:
                c += 1
            else:
                r += 1
                c = 0
            self.defaults.append((var, field, ent))

    def save_defaults(self):
        """Saves default values for entry data"""
        defaults = dict()
        fields_for_input = []
        for default in self.defaults:
            if default[0].get() == 1:
                fields_for_input.append(default[1])
            defaults[default[1]] = default[2].get()
        global app, config_data
        config_data['fields_for_input'] = fields_for_input
        config_data['defaults'] = defaults
        self.outer_frame.destroy()
        self.frame_buttons.destroy()
        app.frame_form = FrameForm(app.master)
        app.frame_buttons.frame.pack(side='top', padx=20, pady=20)
        refresh_form()
        update_config()

    def check_all(self):
        """Checks all entries for input"""
        for default in self.defaults:
            if default[1] not in config_data['always_displayed']:
                default[0].set(1)

    def uncheck_all(self):
        """"Un-checks all entries for input"""
        for default in self.defaults:
            if default[1] not in config_data['always_displayed']:
                default[0].set(0)

    def back(self):
        """Go back to main screen"""
        if messagebox.askokcancel('Confirmation', 'Are you sure?\nAll unsaved data will be lost') is True:
            self.outer_frame.destroy()
            self.frame_buttons.destroy()
            app.frame_form = FrameForm(app.master)
            app.frame_buttons.frame.pack(side='top', padx=20, pady=20)
            refresh_form()
            update_config()

class EditConfig:
    """Edit the default values for entries and also choose which fields to display"""

    def __init__(self):
        self.outer_frame = tk.Frame(app.master)
        self.canvas = tk.Canvas(self.outer_frame, borderwidth=0)
        self.inner_frame = tk.Frame(self.canvas, pady=5, padx=5)
        self.vsb = tk.Scrollbar(self.outer_frame, orient='vertical', command=self.canvas.yview)
        self.frame_buttons = tk.Frame(app.master, bg='#bd9e6f')
        self.save = tk.Button(self.frame_buttons, text='SAVE', width=20, height=5, command=self.save_config)
        self.check_all = tk.Button(self.frame_buttons, text='CHECK ALL', width=20, height=5, command=self.check_all)
        self.uncheck_all = tk.Button(self.frame_buttons, text='UNCHECK ALL', width=20, height=5,
                                     command=self.uncheck_all)
        self.back = tk.Button(self.frame_buttons, text='BACK', width=20, height=5, command=self.back)
        self.defaults = []
        self.updated_config = []
        self.image_path_entry = None

        self.generate_layout()

    def generate_layout(self):
        """Generates layout for this functionality"""
        global app
        app.frame_form.outer_frame.pack_forget()
        app.frame_buttons.frame.pack_forget()
        self.canvas.configure(yscrollcommand=self.vsb.set)
        self.vsb.pack(side='right', fill='y')
        self.canvas.pack(side='left', fill='both', expand=True)
        self.canvas.create_window((4, 4), window=self.inner_frame, anchor='nw')
        self.outer_frame.pack(side='left', padx=40, pady=20)
        self.inner_frame.bind('<Configure>', lambda event: self.canvas.configure(scrollregion=self.canvas.bbox('all')))
        self.populate_form(self.inner_frame)
        self.inner_frame.update()
        self.canvas.configure(width=self.inner_frame.winfo_width() + 10, height=self.inner_frame.winfo_height() + 10)
        self.frame_buttons.pack(side='left', padx=40, pady=20)
        self.save.grid(row=0, pady=10)
        # self.check_all.grid(row=1, pady=10)
        # self.uncheck_all.grid(row=2, pady=10)
        self.back.grid(row=2, pady=10)

    def populate_form(self, master):
        """Generate labels and entry widgets"""
        r = 0
        c = 0
        global config_data
        for i in range(0, len(config_data['application_config'])):
            field = config_data['application_config'][str(i)]['name']
            value = config_data['application_config'][str(i)]['value']
            row = tk.Frame(master)
            var = tk.IntVar()
            cbx = tk.Checkbutton(row, text="", variable=var)
            lab = tk.Label(row, width=32, text=field, anchor='nw')
            
            var.set(value)
            
            row.grid(row=r, column=c, padx=5, pady=5)
            cbx.pack(side='left')
            lab.pack(side='left')

            if c == 0:
                c += 1
            else:
                r += 1
                c = 0

            if field == "Image Save Path":
                cbx.configure(state='disabled')
                lab.configure(width=15)
                open_image = tk.Button(row, text='Browse', command=self.open_image, width=7)
                open_image.pack(side='left')
                self.image_path_entry = tk.Entry(row)
                self.image_path_entry.insert(tk.END, value)
                self.image_path_entry.pack(side='right', expand=True, fill='x')
                self.updated_config.append((var, field, str(i), self.image_path_entry))
            elif field == "Printer Template":
                cbx.configure(state='disabled')
                lab.configure(width=12)

                # Get Print Template List
                print_templates = []
                current_template = None

                file_contents = get_printer_cmds()
                if(file_contents != None):
                    print_templates = get_printer_templates(file_contents)   
                    current_template = get_current_template()

                    if(current_template == None):
                        current_template = ''

                # Dropdown menu options
                options = print_templates
                
                # datatype of menu text
                clicked = StringVar()
                
                # initial menu text
                clicked.set(current_template)
                
                # Create Dropdown menu
                drop = tk.OptionMenu(row, clicked, *options )
                drop.configure(width=15)
                drop.pack(side='left')

                self.updated_config.append((clicked, field, str(i)))
            else:
                # "Auto Generate Design Number"
                self.updated_config.append((var, field, str(i)))

    def open_image(self):
        """Puts Image Name into entry widget after letting user choose an image from file dialog"""

        image_directory = filedialog.askdirectory(title='Select Path')
        # print(image_directory)
        # image_path = image_name
        # image_name = image_name.split('/')[-1]
        # print(image_name)
        
        self.image_path_entry.delete(0, tk.END)
        self.image_path_entry.insert(tk.END, image_directory)

    def save_config(self):
        """Saves default values for entry data"""
        application_config = {}
        for default in self.updated_config:
            index = default[2]

            if(index == '1'):
                # Image Save Path
                field = default[1]
                value = default[3].get()
            elif(index == '2'):
                # Printer Template
                field = default[1]
                value = default[0].get()
            else:
                field = default[1]
                value = default[0].get()

            application_config[index] = {
                "name": field,
                "value": value
            }

        global app, config_data
        config_data['application_config'] = application_config
        self.outer_frame.destroy()
        self.frame_buttons.destroy()
        app.frame_form = FrameForm(app.master)
        app.frame_buttons.frame.pack(side='top', padx=20, pady=20)
        refresh_form()
        update_config()

    def check_all(self):
        """Checks all entries for input"""
        for default in self.defaults:
            if default[1] not in config_data['always_displayed']:
                default[0].set(1)

    def uncheck_all(self):
        """"Un-checks all entries for input"""
        for default in self.defaults:
            if default[1] not in config_data['always_displayed']:
                default[0].set(0)

    def back(self):
        """Go back to main screen"""
        if messagebox.askokcancel('Confirmation', 'Are you sure?\nAll unsaved data will be lost') is True:
            self.outer_frame.destroy()
            self.frame_buttons.destroy()
            app.frame_form = FrameForm(app.master)
            app.frame_buttons.frame.pack(side='top', padx=20, pady=20)
            refresh_form()
            update_config()

# noinspection SqlDialectInspection
class EditProduct:
    """Edit the product details of a product present in the database"""

    def __init__(self):
        self.get_tag()
        self.product_details = dict()
        if self.get_details() != 0:
            self.outer_frame = tk.Frame(app.master)
            self.canvas = tk.Canvas(self.outer_frame, borderwidth=0)
            self.inner_frame = tk.Frame(self.canvas, pady=5, padx=5)
            self.vsb = tk.Scrollbar(self.outer_frame, orient='vertical', command=self.canvas.yview)
            self.frame_buttons = tk.Frame(app.master, bg='#bd9e6f')
            self.save_details = tk.Button(self.frame_buttons, text='SAVE', width=20, height=5,
                                          command=self.save_details)
            self.delete_product = tk.Button(self.frame_buttons, text='DELETE', width=20, height=5,
                                            command=self.delete_product)
            self.back = tk.Button(self.frame_buttons, text='BACK', width=20, height=5, command=self.back)
            self.new_entries = []
            self.final_details = dict()
            self.generate_layout()

    def get_tag(self):
        """Get RFID tag/Sr.No. from user"""
        self.flag = 0
        self.subroot = tk.Tk()
        self.subroot.title('Tag info')
        self.var = tk.StringVar(self.subroot)
        opt1 = tk.Radiobutton(self.subroot, text="Sr. No.", value="product_id", variable=self.var)
        opt2 = tk.Radiobutton(self.subroot, text="RFID Tag", value="rfidTag", variable=self.var)
        self.var.set('product_id')
        val_lab = tk.Label(self.subroot, text="Value: ")
        self.val_ent = tk.Entry(self.subroot, width=10)
        opt1.grid(row=0, column=0, padx=2, pady=2)
        opt2.grid(row=0, column=1, padx=2, pady=2)
        val_lab.grid(row=1, column=0, padx=2, pady=2)
        self.val_ent.grid(row=1, column=1, padx=2, pady=2)
        ok_button = tk.Button(self.subroot, text="OK", command=self.ok).grid(row=2, column=0, padx=2, pady=2)
        can_button = tk.Button(self.subroot, text="Cancel", command=self.can).grid(row=2, column=1, padx=2, pady=2)
        self.subroot.mainloop()

    def ok(self):
        self.tag = self.val_ent.get()
        self.var = self.var.get()
        self.subroot.quit()
        self.subroot.destroy()

    def can(self):
        self.tag = None
        self.subroot.quit()
        self.subroot.destroy()

    def get_details(self):
        """Get details of product that user wants to edit and check if it is present in the database"""

        query = 'SELECT {} FROM {} WHERE {} is NULL'.format(self.var, config_data['mysql']['table'], 'deleted_at')
        rfid_tags = execute_query(query, 1)
        rfid_tags = single_column(rfid_tags)
        if self.tag is not None:
            if (self.tag in rfid_tags and self.var=='rfidTag') or (int(self.tag) in rfid_tags and self.var=='product_id'):
                query = "SELECT * FROM {} WHERE {} = '{}'".format(config_data['mysql']['table'], self.var, self.tag)
                result = execute_query(query, 1)
                ctr = 0
                for field in fields:
                    if config_data['name_mapping'][field] in config_data['defaults']:
                        self.product_details[config_data['name_mapping'][field]] = result[0][ctr]
                    ctr += 1
            else:
                messagebox.showerror('Error', '{} is not present in the database'.format(self.tag))
                return 0
        else:
            return 0

    def generate_layout(self):
        """Generates layout for this functionality"""
        global app
        app.frame_form.outer_frame.pack_forget()
        app.frame_buttons.frame.pack_forget()
        self.canvas.configure(yscrollcommand=self.vsb.set)
        self.vsb.pack(side='right', fill='y')
        self.canvas.pack(side='left', fill='both', expand=True)
        self.canvas.create_window((4, 4), window=self.inner_frame, anchor='nw')
        self.outer_frame.pack(side='left', padx=40, pady=20)
        self.inner_frame.bind('<Configure>', lambda event: self.canvas.configure(scrollregion=self.canvas.bbox('all')))
        self.populate_form(self.inner_frame)
        self.inner_frame.update()
        self.canvas.configure(width=self.inner_frame.winfo_width() + 10, height=self.inner_frame.winfo_height() + 10)
        self.frame_buttons.pack(side='left', padx=40, pady=20)
        self.save_details.grid(row=0, pady=10)
        self.delete_product.grid(row=1, pady=10)
        self.back.grid(row=2, pady=10)

    def populate_form(self, master):
        """Generate labels and entry widgets"""
        r = 0
        c = 0
        global config_data
        for i in range(0, len(config_data['ordering'])):
            field = config_data['ordering'][str(i)]
            row = tk.Frame(master)
            lab = tk.Label(row, width=20, text=field, anchor='w')
            ent = tk.Entry(row)
            if self.product_details[field] is not None:
                ent.insert(tk.END, self.product_details[field])
            else:
                ent.insert(tk.END, '')
            if field == 'RFID Tag' or field == 'SKU Number' or field in config_data['field_for_tag']:
                ent.configure(state='readonly')
            row.grid(row=r, column=c, padx=5, pady=5)
            lab.pack(side='left')
            ent.pack(side='right', expand=True, fill='x')
            if c == 0:
                c += 1
            else:
                r += 1
                c = 0
            self.new_entries.append((field, ent))

    def get_new_details(self):
        """Gets new entered data from user"""
        for entry in self.new_entries:
            if entry[1].get() == '':
                self.product_details[entry[0]] = config_data['defaults'][entry[0]]
            else:
                self.product_details[entry[0]] = entry[1].get()

        # Create dictionary according to database model
        global fields
        for field in fields:
            if config_data['name_mapping'][field] in self.product_details:
                self.final_details[field] = self.product_details[config_data['name_mapping'][field]]
        self.final_details['updated_at'] = datetime.now()

    def save_details(self):
        """Saves the new details for selected product"""
        self.get_new_details()
        query = "UPDATE {} SET ".format(config_data['mysql']['table'])
        for i in self.final_details.items():
            query += i[0] + " = "
            if str(i[1]) != '':
                query += "'" + str(i[1]) + "', "
            else:
                query += "NULL, "
        query = query[0:len(query) - 2]
        query += " WHERE {} = '{}'".format('product_id', self.tag)
        execute_query(query)
        self.outer_frame.destroy()
        self.frame_buttons.destroy()
        app.frame_form = FrameForm(app.master)
        app.frame_buttons.frame.pack(side='top', padx=20, pady=20)
        refresh_form()

    def delete_product(self):
        """Deletes selected product"""
        if messagebox.askokcancel('Confirmation', 'Are you sure you want to delete product?') is True:
            query = "UPDATE {} SET {} = '{}' WHERE {} = '{}'".format(config_data['mysql']['table'], 'deleted_at',
                                                                     str(datetime.now()), 'product_id', self.tag)
            execute_query(query)
            self.outer_frame.destroy()
            self.frame_buttons.destroy()
            app.frame_form = FrameForm(app.master)
            app.frame_buttons.frame.pack(side='top', padx=20, pady=20)
            refresh_form()

    def back(self):
        """Go back to main screen"""
        if messagebox.askokcancel('Confirmation', 'Are you sure?\nAll unsaved data will be lost') is True:
            self.outer_frame.destroy()
            self.frame_buttons.destroy()
            app.frame_form = FrameForm(app.master)
            app.frame_buttons.frame.pack(side='top', padx=20, pady=20)
            refresh_form()
            update_config()

class EditProduct2:
    """Edit the product details of a product present in the database"""

    def __init__(self,parent_frame,parent_buttons,product_id):
        # self.get_tag()
        self.product_id = product_id
        self.product_details = dict()
        if self.get_details(product_id) != 0:
            self.parent_frame = parent_frame
            self.parent_buttons = parent_buttons

            self.outer_frame = tk.Frame(app.master)
            self.canvas = tk.Canvas(self.outer_frame, borderwidth=0)
            self.inner_frame = tk.Frame(self.canvas, pady=5, padx=5)
            self.vsb = tk.Scrollbar(self.outer_frame, orient='vertical', command=self.canvas.yview)
            self.frame_buttons = tk.Frame(app.master, bg='#bd9e6f')
            self.save_details = tk.Button(self.frame_buttons, text='SAVE', width=20, height=5,
                                          command=self.save_details)
            self.delete_product = tk.Button(self.frame_buttons, text='DELETE', width=20, height=5,
                                            command=self.delete_product)
            self.back = tk.Button(self.frame_buttons, text='BACK', width=20, height=5, command=self.back)
            self.new_entries = []
            self.final_details = dict()
            self.generate_layout()

    def get_details(self,product_id):
        """Get details of product that user wants to edit"""

        if product_id is not None:
            query = "SELECT * FROM {} WHERE product_id = '{}'".format(config_data['mysql']['table'], product_id)
            result = execute_query(query, 1)
            ctr = 0
            for field in fields:
                if config_data['name_mapping'][field] in config_data['defaults']:
                    self.product_details[config_data['name_mapping'][field]] = result[0][ctr]
                ctr += 1
        else:
            return 0

    def generate_layout(self):
        """Generates layout for this functionality"""
        global app

        # self.outer_frame.destroy()
        # self.frame_buttons.destroy()
        # app.frame_form = FrameForm(app.master)
        # app.frame_buttons.frame.pack(side='top', padx=20, pady=20)
        # refresh_form()
        # update_config()

        self.parent_frame.pack_forget()

        if(self.parent_buttons[0] != None):
            self.parent_buttons[0].pack_forget()
        if(self.parent_buttons[1] != None):
            self.parent_buttons[1].pack_forget()
        # self.outer_frame.pack_forget()
        # self.frame_buttons.pack_forget()
        self.canvas.configure(yscrollcommand=self.vsb.set)
        self.vsb.pack(side='right', fill='y')
        self.canvas.pack(side='left', fill='both', expand=True)
        self.canvas.create_window((4, 4), window=self.inner_frame, anchor='nw')
        self.outer_frame.pack(side='left', padx=40, pady=20)
        self.inner_frame.bind('<Configure>', lambda event: self.canvas.configure(scrollregion=self.canvas.bbox('all')))
        self.populate_form(self.inner_frame)
        self.inner_frame.update()
        self.canvas.configure(width=self.inner_frame.winfo_width() + 10, height=self.inner_frame.winfo_height() + 10)
        self.frame_buttons.pack(side='left', padx=40, pady=20)
        self.save_details.grid(row=0, pady=10)
        self.delete_product.grid(row=1, pady=10)
        self.back.grid(row=2, pady=10)

    def populate_form(self, master):
        """Generate labels and entry widgets"""
        r = 0
        c = 0
        global config_data
        for i in range(0, len(config_data['ordering'])):
            field = config_data['ordering'][str(i)]
            row = tk.Frame(master)
            lab = tk.Label(row, width=20, text=field, anchor='w')
            ent = tk.Entry(row)
            if self.product_details[field] is not None:
                ent.insert(tk.END, self.product_details[field])
            else:
                ent.insert(tk.END, '')
            if field == 'RFID Tag' or field == 'SKU Number' or field in config_data['field_for_tag']:
                ent.configure(state='readonly')
            row.grid(row=r, column=c, padx=5, pady=5)
            lab.pack(side='left')
            ent.pack(side='right', expand=True, fill='x')
            if c == 0:
                c += 1
            else:
                r += 1
                c = 0
            self.new_entries.append((field, ent))

    def get_new_details(self):
        """Gets new entered data from user"""
        for entry in self.new_entries:
            if entry[1].get() == '':
                self.product_details[entry[0]] = config_data['defaults'][entry[0]]
            else:
                self.product_details[entry[0]] = entry[1].get()

        # Create dictionary according to database model
        global fields
        for field in fields:
            if config_data['name_mapping'][field] in self.product_details:
                self.final_details[field] = self.product_details[config_data['name_mapping'][field]]
        self.final_details['updated_at'] = datetime.now()

    def save_details(self):
        """Saves the new details for selected product"""
        self.get_new_details()
        query = "UPDATE {} SET ".format(config_data['mysql']['table'])
        for i in self.final_details.items():
            query += i[0] + " = "
            if str(i[1]) != '':
                query += "'" + str(i[1]) + "', "
            else:
                query += "NULL, "
        query = query[0:len(query) - 2]
        query += " WHERE {} = '{}'".format('product_id', self.product_id)
        execute_query(query)
        self.outer_frame.destroy()
        self.frame_buttons.destroy()
        app.frame_form = FrameForm(app.master)
        app.frame_buttons.frame.pack(side='top', padx=20, pady=20)
        DeleteProducts()
        # refresh_form()

    def delete_product(self):
        """Deletes selected product"""
        if messagebox.askokcancel('Confirmation', 'Are you sure you want to delete product?') is True:
            query = "UPDATE {} SET {} = '{}' WHERE {} = '{}'".format(config_data['mysql']['table'], 'deleted_at',
                                                                     str(datetime.now()), 'product_id', self.product_id)
            execute_query(query)
            self.outer_frame.destroy()
            self.frame_buttons.destroy()
            app.frame_form = FrameForm(app.master)
            app.frame_buttons.frame.pack(side='top', padx=20, pady=20)
            DeleteProducts()
            # refresh_form()

    def back(self):
        """Go back to main screen"""
        if messagebox.askokcancel('Confirmation', 'Are you sure?\nAll unsaved data will be lost') is True:
            self.outer_frame.destroy()
            self.frame_buttons.destroy()
            app.frame_form = FrameForm(app.master)
            app.frame_buttons.frame.pack(side='top', padx=20, pady=20)
            DeleteProducts()
            # refresh_form()
            # update_config()

class DeleteProducts:
    """Creates list of products and gives ability to delete multiple products"""

    def __init__(self):
        global config_data

        self.outer_frame = tk.Frame(app.master)
        self.canvas = tk.Canvas(self.outer_frame, borderwidth=0)
        self.inner_frame = tk.Frame(self.canvas, pady=5, padx=5)
        self.vsb = tk.Scrollbar(self.outer_frame, orient='vertical', command=self.canvas.yview)
        self.hsb = tk.Scrollbar(self.outer_frame, orient='horizontal', command=self.canvas.xview)
        self.frame_buttons = tk.Frame(app.master, bg='#bd9e6f')
        self.bottom_frame_buttons = tk.Frame(app.master, bg='#bd9e6f')
        self.delete = tk.Button(self.frame_buttons, text='DELETE', width=10, height=2, command=self.delete,
                                state='disabled')
        self.edit = tk.Button(self.frame_buttons, text='EDIT', width=10, height=2, command=self.edit,
                                state='disabled')
        self.generate_excel = tk.Button(self.frame_buttons, text='GENERATE EXCEL', width=10, height=2, command=self.generate_excel,
                                state='disabled')
        self.print_products = tk.Button(self.frame_buttons, text='PRINT', width=10, height=2, command=self.print_products,
                                state='disabled')
        self.back = tk.Button(self.frame_buttons, text='BACK', width=10, height=2, command=self.back)

        
        search_text = tk.StringVar()
        self.search_box = tk.Entry(self.frame_buttons, width=15, textvariable=search_text)
        self.search_button = tk.Button(self.frame_buttons, text='Search', width=10, height=1, command=self.search_products)
        self.clear_button = tk.Button(self.frame_buttons, text='Clear', width=10, height=1, command=self.clear_filters)

        # L1 = tk.Label(self.frame_buttons, text="User Name")
        # L1.pack(side='LEFT')
        self.start_date_label = tk.Label(self.frame_buttons, bg= "#bd9e6f", justify='right', text="From Date")
        self.start_date = DateEntry(self.frame_buttons, width= 15, date_pattern='yyyy-mm-dd')
        self.start_date.delete(0, "end")

        self.end_date_label = tk.Label(self.frame_buttons, bg= "#bd9e6f", justify='right', text="To Date")
        self.end_date = DateEntry(self.frame_buttons, width= 15, date_pattern='yyyy-mm-dd')
        self.end_date.delete(0, "end")

        # bottom buttons
        self.page_label = tk.Label(self.bottom_frame_buttons, bg= "#bd9e6f", justify='right', text="")
        self.count_label = tk.Label(self.bottom_frame_buttons, bg= "#bd9e6f", justify='right', text="")
        self.previous = tk.Button(self.bottom_frame_buttons, text='Previous', width=10, height=1, command=self.previous_page)
        self.next = tk.Button(self.bottom_frame_buttons, text='Next', width=10, height=1, command=self.next_page)

        self.limit = config_data['list_fetch_limit']
        self.page_no = 1
        self.page_count = 0
        self.total_count = 0
        self.checked_length = 0
        self.filters = None
        self.markers = []
        self.var = tk.IntVar()
        self.cbname = ""
        self.products = dict()
        self.get_products()
        self.generate_layout()

    def get_products(self):
        # filters = { 'search_text': search_text }
        """"Get all products from database"""
        count_query = "SELECT COUNT(*) FROM {} WHERE {} is NULL ".format(config_data['mysql']['table'], 'deleted_at')
        query = "SELECT * FROM {} WHERE {} is NULL ".format(config_data['mysql']['table'], 'deleted_at')
        extra_query = ""

        filters = self.filters

        if(filters != None):
            # 'search_text' filter
            if('search_text' in filters and filters['search_text'] != None):
                search_columns = ['rfidtag','designNumber']
                extra_query += 'AND ('
            
                for column in search_columns:
                    extra_query += ' {} LIKE \'%{}%\' OR'.format(column, filters['search_text'])

                extra_query = extra_query[0:len(extra_query) - 2] + ")"

            # 'start_date' filter
            if('start_date' in filters and filters['start_date'] != None):
                extra_query += ' AND {} >= \'{}\' '.format('created_at', filters['start_date'])

            # 'end_date' filter
            if('end_date' in filters and filters['end_date'] != None):
                extra_query += ' AND {} <= \'{}\' '.format('created_at', filters['end_date'])

        # print(extra_query)
 
        skip = (self.page_no * self.limit) - self.limit
        extra_query += " order by product_id desc"
        count_query += extra_query

        extra_query += " LIMIT {} OFFSET {} ".format(self.limit, skip)
        query += extra_query

        count_result = list(execute_query(count_query, 1))
        # print(count_result)
        self.total_count = count_result[0][0]
        self.page_count = int(self.total_count / self.limit)
        if(self.total_count % self.limit > 0):
            self.page_count+=1

        result = list(execute_query(query, 1))
        key = 0
        self.products = dict()

        for product in result:
            ctr = 0
            self.products[key] = dict()
            for field in fields:
                if config_data['name_mapping'][field] in config_data['defaults']:
                    if product[ctr] is not None:
                        self.products[key][config_data['name_mapping'][field]] = product[ctr]
                    else:
                        self.products[key][config_data['name_mapping'][field]] = ''
                ctr += 1
            key += 1

    def generate_layout(self):
        """Generate layout for this functionality"""
        global app
        app.frame_form.outer_frame.pack_forget()
        app.frame_buttons.frame.pack_forget()

        self.bottom_frame_buttons.pack(side="bottom", padx=40, pady=5, anchor='e')
        # bottom buttons
        self.page_label.grid(row=0, column=0)
        self.count_label.grid(row=0, column=1)
        self.previous.grid(row=0, column=2, padx=5)
        self.next.grid(row=0, column=3, padx=5)
        self.count_label.configure(text="Total: "+str(self.total_count))
        self.page_label.configure(text="Page {} of {}".format(str(self.page_no),str(self.page_count)))


        self.frame_buttons.pack(padx=40, pady=5, anchor='nw')
        self.delete.grid(row=0, column=0, padx=5)
        self.edit.grid(row=0, column=1, padx=5)
        self.generate_excel.grid(row=0, column=2, padx=5)
        self.print_products.grid(row=0, column=3, padx=5)
        self.back.grid(row=0, column=4, padx=5)
        self.search_box.grid(row=1, column=0, padx=10, pady=15)

        self.start_date_label.grid(row=1, column=1, sticky = 'e')
        self.start_date.grid(row=1, column=2)

        self.end_date_label.grid(row=1, column=3, sticky = 'e')
        self.end_date.grid(row=1, column=4)

        self.search_button.grid(row=1, column=5, padx=5, rowspan=3)
        self.clear_button.grid(row=1, column=6, padx=5, rowspan=3)

        # refresh list frame
        self.outer_frame.destroy()
        self.outer_frame = tk.Frame(app.master)
        self.canvas = tk.Canvas(self.outer_frame, borderwidth=0)
        self.inner_frame = tk.Frame(self.canvas, pady=5, padx=5)
        self.vsb = tk.Scrollbar(self.outer_frame, orient='vertical', command=self.canvas.yview)
        self.hsb = tk.Scrollbar(self.outer_frame, orient='horizontal', command=self.canvas.xview)

        self.canvas.configure(yscrollcommand=self.vsb.set, xscrollcommand=self.hsb.set)
        self.vsb.pack(side='right', fill='y')
        self.hsb.pack(side='bottom', fill='x')
        self.canvas.pack(side='left', fill='both', expand=True)
        self.canvas.create_window((4, 4), window=self.inner_frame, anchor='nw')
        self.outer_frame.pack(side='left', padx=40, pady=0, anchor='nw')
        self.inner_frame.bind('<Configure>', lambda event: self.canvas.configure(scrollregion=self.canvas.bbox('all')))

        self.populate_form(self.inner_frame)
        self.inner_frame.update()
        self.canvas.configure(width=self.inner_frame.winfo_width(), height=self.inner_frame.winfo_height())


    def populate_form(self, master):
        """Generate labels and entry widgets"""
        r = 0
        c = 0
        global config_data
        row = tk.Frame(master)
        cbx = tk.Checkbutton(row, text="", variable=self.var)
        self.cbname = self.var.trace("w", lambda name, index, mode, var=self.var: self.check_uncheck())
        cbx.grid(row=0, column=c)
        c += 1
        for header in config_data['fields_for_delete']:
            lab = tk.Label(row, text=header, anchor='w', padx=10, width=15)
            lab.grid(row=0, column=c)
            c += 1
        row.grid(row=r)
        r += 1
        for product in self.products.values():
            row = tk.Frame(master)
            c = 0
            var = tk.IntVar()
            var.trace("w", lambda name, index, mode, var=var: self.set_master_check(var))
            cbx = tk.Checkbutton(row, text="", variable=var, bg='#ffffff')
            cbx.grid(row=0, column=c)
            c += 1
            for header in config_data['fields_for_delete']:
                lab = tk.Label(row, text=product[header], anchor='w', padx=10, bg='#ffffff', width=15)
                lab.grid(row=0, column=c)
                c += 1
            row.grid(row=r)
            r += 1
            self.markers.append((var, product['Sr No']))

    def delete(self):
        if messagebox.askokcancel('Confirmation', 'Selected products will be deleted!') is True:
            query = "UPDATE {} SET {} = '{}' WHERE {} in (".format(config_data['mysql']['table'], 'deleted_at',
                                                                   str(datetime.now()), 'product_id')
            for marker in self.markers:
                if marker[0].get() == 1:
                    query += "'{}', ".format(marker[1])
            query = query[0:len(query) - 2] + ")"
            execute_query(query)
            self.outer_frame.destroy()
            self.frame_buttons.destroy()
            self.bottom_frame_buttons.destroy()
            app.frame_form = FrameForm(app.master)
            app.frame_buttons.frame.pack(side='top', padx=20, pady=20)
            refresh_form()

    def edit(self):
        # print(self.markers[0])
        for marker in self.markers:
            if marker[0].get() == 1:
                product_id = marker[1]
                EditProduct2(self.outer_frame,[self.frame_buttons,self.bottom_frame_buttons],product_id)
                break

    def previous_page(self):
        if(self.page_no == 1):
            return

        self.page_no -= 1
        # print(self.page_no)

        self.reset_variables()

        self.get_products()
        # print(len(self.products))
        self.generate_layout()

    def next_page(self):
        if(self.page_no + 1 > self.page_count):
            return

        self.page_no += 1
        # print(self.page_no)

        self.reset_variables()

        self.get_products()
        # print(len(self.products))
        self.generate_layout()

    def back(self):
        self.outer_frame.destroy()
        self.frame_buttons.destroy()
        self.bottom_frame_buttons.destroy()
        app.frame_form = FrameForm(app.master)
        app.frame_buttons.frame.pack(side='top', padx=20, pady=20)
        refresh_form()
        update_config()

    def check_uncheck(self):
        """Checks or un-checks all products"""
        state = self.var.get()
        # self.checked_length = 0
        for marker in self.markers:
            marker[0].set(state)

            # if state == 1:
            #     self.checked_length+= 1
            # else:
            #     self.checked_length-= 1

            # print(self.checked_length)

    def set_master_check(self, var):
        """Sets the check/un-check all button and enables or disables delete button"""
        # print('changed')
        # print(var.get())
        if var.get() == 0:
            if(self.checked_length != 0):
                self.checked_length-= 1
            # Enable edit button only if 1 product selected
            # print(self.checked_length)
            if(self.checked_length != 1):
                self.edit.configure(state='disabled')
            else:
                self.edit.configure(state='normal')

            self.var.trace_vdelete("w", self.cbname)
            self.var.set(0)
            self.cbname = self.var.trace("w", lambda name, index, mode, var=self.var: self.check_uncheck())
            for marker in self.markers:
                if marker[0].get() == 1:
                    return 0

            self.delete.configure(state='disabled')
            self.edit.configure(state='disabled')
            self.generate_excel.configure(state='disabled')
            self.print_products.configure(state='disabled')

            
                
        if var.get() == 1:
            if(self.checked_length < len(self.products)):
                self.checked_length+= 1
            self.delete.configure(state='normal')
            self.generate_excel.configure(state='normal')
            self.print_products.configure(state='normal')

            # Enable edit button only if 1 product selected
            # print(self.checked_length)
            if(self.checked_length == 1):
                self.edit.configure(state='normal')
            else:
                self.edit.configure(state='disabled')

            for marker in self.markers:
                if marker[0].get() == 0:
                    return
            self.var.set(1)

    def generate_excel(self):
        product_ids = []
        for marker in self.markers:
            if marker[0].get() == 1:
                product_ids.append(marker[1])

        GenerateExcel2(product_ids)

    def print_products(self):
        product_ids = []
        for marker in self.markers:
            if marker[0].get() == 1:
                product_ids.append(marker[1])

        PrintData2(product_ids)

    def search_products(self):
        search_text = self.search_box.get()
        start_date = self.start_date.get()
        end_date = self.end_date.get()
        # print(search_text)
        # print(start_date)
        # print(end_date)

        if(search_text == '' and start_date == '' and end_date == ''):
            messagebox.showerror('Error!', 'No Filter Selected')
        else:
            filters = {}
            if(search_text != ''):
                filters['search_text'] = search_text
            if(start_date != ''):
                filters['start_date'] = start_date
            if(end_date != ''):
                filters['end_date'] = end_date

            self.reset_variables()
            self.page_no = 1

            self.filters = filters
            self.get_products()
            # print(len(self.products))
            self.generate_layout()

    def clear_filters(self):
        # clear search box text
        self.search_box.delete(0, 'end')
        self.start_date.delete(0, 'end')
        self.end_date.delete(0, 'end')

        self.reset_variables()
        self.page_no = 1

        self.filters = None
        self.get_products()
        # print(len(self.products))
        self.generate_layout()
    
    def reset_variables(self):
        self.checked_length = 0
        self.markers = []
        self.var = tk.IntVar()
        self.cbname = ""

        self.delete.configure(state='disabled')
        self.edit.configure(state='disabled')
        self.generate_excel.configure(state='disabled')
        self.print_products.configure(state='disabled')
            

class DeletePerm:
    """Delete all the Products Permanantly from the Database and reset Product_id to 1 - Prashant"""

    def __init__(self):
        self.delete_from_db()

    def delete_from_db(self):
        if messagebox.askokcancel('Confirmation',
                                  'Complete data will be DELETED\nAre you sure you want to continue?') is True:
            query = "TRUNCATE {}".format(config_data['mysql']['table'])
            execute_query(query)
            refresh_form()

class GenerateExcel2:
    """Generate Products.xlsx that can be used to import data via app/dashboard"""

    def __init__(self,product_ids):
        from openpyxl import Workbook
        self.wb = Workbook()
        self.ws = self.wb.active
        self.products = dict()
        self.get_products(product_ids)
        self.save_products()
        self.create_excel()

    def get_products(self,product_ids):
        """Get products from the database"""

        # root = tk.Tk()
        # ToFrom(root).grid()
        # root.mainloop()
        # root.destroy()

        # fromsr = inputdata['From']
        # tosr = inputdata['To']

        query = "SELECT * FROM {} WHERE {} is NULL and product_id in (".format(config_data['mysql']['table'], 'deleted_at',product_ids)
        for product_id in product_ids:
            query += "{}, ".format(product_id)

        query = query[0:len(query) - 2] + ")"

        result = list(execute_query(query, 1))
        key = 0
        for product in result:
            ctr = 0
            product = list(product)
            self.products[key] = dict()
            #print("fields - {}", fields)
            for field in fields:
                if config_data['name_mapping'][field]:
                    #print(config_data['name_mapping'][field])
                    if product[ctr] is not None:
                        try:
                            #print(product[ctr])
                            product[ctr]
                            product[ctr] = int(product[ctr])
                        except ValueError:
                            pass
                        finally:
                            self.products[key][config_data['name_mapping'][field]] = product[ctr]
                    else:
                        self.products[key][config_data['name_mapping'][field]] = ''
                ctr += 1
            key += 1

    def save_products(self):
        """Save all products to excel sheet"""
        self.ws.append(list(config_data['orderingexcel'].values()))

        order = (sorted(self.products.keys(),
                        key=lambda x: (self.products[x]['RFID Tag'])))
        sorted_products = dict()
        ctr = 0
        for i in order:
            sorted_products[ctr] = self.products[i]
            ctr += 1
        for product in sorted_products.values():
            row = []
            for column in config_data['orderingexcel']:
                row.append(product[config_data['orderingexcel'][str(column)]])
            self.ws.append(row)

    def create_excel(self):
        """Create excel file at user-desired location"""
        path = filedialog.asksaveasfilename(title="Please select a file name for saving:",
                                            filetypes=[("Excel SpreadSheet", "*.xlsx")],
                                            initialfile="Products " + str(time.strftime('%d%m%Y_%H%M')),
                                            defaultextension=".xlsx")
        if path != () and path != '':
            self.wb.save(path)
            messagebox.showinfo("Success", "File generated successfully!")


class GenerateExcel:
    """Generate Products.xlsx that can be used to import data via app/dashboard"""

    def __init__(self,):
        from openpyxl import Workbook
        self.wb = Workbook()
        self.ws = self.wb.active
        self.products = dict()
        self.get_products()
        self.save_products()
        self.create_excel()

    def get_products(self):
        """Get products from the database"""

        # root = tk.Tk()
        # ToFrom(root).grid()
        # root.mainloop()
        # root.destroy()

        fromsr = inputdata['From']
        tosr = inputdata['To']

        query = "SELECT * FROM {} WHERE {} is NULL and product_id >= {} and product_id <= {} ".format(config_data['mysql']['table'], 'deleted_at',fromsr,tosr)
        result = list(execute_query(query, 1))
        key = 0
        for product in result:
            ctr = 0
            product = list(product)
            self.products[key] = dict()
            #print("fields - {}", fields)
            for field in fields:
                if config_data['name_mapping'][field]:
                    #print(config_data['name_mapping'][field])
                    if product[ctr] is not None:
                        try:
                            #print(product[ctr])
                            product[ctr]
                            product[ctr] = int(product[ctr])
                        except ValueError:
                            pass
                        finally:
                            self.products[key][config_data['name_mapping'][field]] = product[ctr]
                    else:
                        self.products[key][config_data['name_mapping'][field]] = ''
                ctr += 1
            key += 1

    def save_products(self):
        """Save all products to excel sheet"""
        self.ws.append(list(config_data['orderingexcel'].values()))

        order = (sorted(self.products.keys(),
                        key=lambda x: (self.products[x]['RFID Tag'])))
        sorted_products = dict()
        ctr = 0
        for i in order:
            sorted_products[ctr] = self.products[i]
            ctr += 1
        for product in sorted_products.values():
            row = []
            for column in config_data['orderingexcel']:
                row.append(product[config_data['orderingexcel'][str(column)]])
            self.ws.append(row)

    def create_excel(self):
        """Create excel file at user-desired location"""
        path = filedialog.asksaveasfilename(title="Please select a file name for saving:",
                                            filetypes=[("Excel SpreadSheet", "*.xlsx")],
                                            initialfile="Products " + str(time.strftime('%d%m%Y_%H%M')),
                                            defaultextension=".xlsx")
        if path != () and path != '':
            self.wb.save(path)
            messagebox.showinfo("Success", "File generated successfully!")

class PrintData2:
    def __init__(self,product_ids):
        self.products = dict()
        self.get_data(product_ids)


    def get_data(self,product_ids):
        # root = tk.Tk()
        # ToFrom(root).grid()
        # root.mainloop()
      
        # root.destroy()

        # fromsr = inputdata['From']
        # tosr = inputdata['To']

        query = "SELECT * FROM {} WHERE {} is NULL and product_id in (".format(config_data['mysql']['table'], 'deleted_at',product_ids)
        for product_id in product_ids:
            query += "{}, ".format(product_id)

        query = query[0:len(query) - 2] + ")"

        self.products = list(execute_query(query, 1))

        global fields
        updated_product_list = []
        for i in range(0,len(self.products)):
            product_dict = dict()

            for j in range(0,len(fields)):
                field = fields[j]
                # print(field)
                product_dict[field] = self.products[i][j]

            updated_product_list.append(product_dict)

        self.products = updated_product_list

        if len(self.products) == 0:
            messagebox.showerror('Error!', 'Sr No is not present')
        else:
            self.print_data_multiple_templates()

    def print_data(self):
        zpldict = config_data["ZPL"]
        zpl0 = zpldict["0"]
        zpl1 = zpldict["1"]
        zpl2 = zpldict["2"]
        zpl3 = zpldict["3"]
        zpl4 = zpldict["4"]
        zpl5 = zpldict["5"]
        zpl6 = zpldict["6"]
        zpl7 = zpldict["7"]
        zpl8 = zpldict["8"]
        zpl9 = zpldict["9"]
        zpl10 = zpldict["10"]

        zpl = ""
        ctr = 1
        for product in self.products:
            # print(product)

            product = list(product)
            # print(product)

            zpl1new = zpl1.replace('recno', str(ctr))
            zpl2new = zpl2.replace('rfidTag',str(product[0]))
            zpl5new = zpl5.replace('designNumber',str(product[1]))
            zpl6new = zpl6.replace('netWeight',str(product[2]))
            zpl7new = zpl7.replace('rfidTag', str(product[0]))
            zpl8new = zpl8.replace('metalPurity',str(product[3]))

            zpl = zpl +"\n\n" + zpl0 + "\n\n" + zpl1new + "\n" + zpl2new + "\n" + zpl3 + "\n" + zpl4 +"\n" +  zpl5new + "\n" +zpl6new + "\n" + zpl7new + "\n" + zpl8new +  "\n" +zpl9 + "\n" + zpl10
            ctr = ctr + 1

        # print(zpl)

        printnamedict = config_data["printername"]
        printername = printnamedict["0"]
        for p in win32print.EnumPrinters(win32print.PRINTER_ENUM_LOCAL,
                                               None, 1):
            if (p[2] == printername):
                printdefaults = {"DesiredAccess": win32print.PRINTER_ALL_ACCESS}

                level = 2


                raw_data = bytes(zpl,"utf-8")

                hPrinter = win32print.OpenPrinter(p[2], printdefaults)

                try:
                    hJob = win32print.StartDocPrinter(hPrinter, 1, ("RFID tag print", None, "RAW"))
                    try:
                        win32print.StartPagePrinter(hPrinter)
                        win32print.WritePrinter(hPrinter, raw_data)
                        win32print.EndPagePrinter(hPrinter)
                    finally:
                        win32print.EndDocPrinter(hPrinter)
                finally:

                    win32print.ClosePrinter(hPrinter)

    def print_data_multiple_templates(self):
        file_contents = get_printer_cmds()
        if(file_contents == None):
            messagebox.showinfo("Error", "Print Cmd File not found")
            return

        print_templates = get_printer_templates(file_contents)   
        current_template = get_current_template()
        if(current_template == None):
            messagebox.showinfo("Error", "Default Print Template not set in config")
            return

        if(current_template not in print_templates):
            messagebox.showinfo("Error", "Default Print Template not found in cmd file")
            return

        template_config = get_template_config(current_template,file_contents)
        if(template_config == None):
            messagebox.showinfo("Error", "Could not read Template - {0} in cmd file".format(current_template))
            return

        if(len(template_config) == 0):
            messagebox.showinfo("Error", "Template - {0} has no config in cmd file".format(current_template))
            return

        # clean template_config strings & replace ${} with actual variables
        print_cmds = [] # cmds to be sent to the printer
      
        for product in self.products:
            product['totalNetWeight'] = get_number_from_string(product['netWeight']) + get_number_from_string(product['findingWeight'])
            
            print(product['totalNetWeight'])
            for i in range(0,len(template_config)):
                template_line = template_config[i]
                template_line = template_line.replace('$','')

                try:
                    template_line = template_line.format(**product)
                    print_cmds.append(template_line)
                except KeyError as e:
                    # print(e)
                    messagebox.showinfo("Error", "Invalid variable - {0} in cmd print cmd".format(e.args[0]))
                    return
        
        print_cmds = '\n'.join(print_cmds)
        print(print_cmds)

        printnamedict = config_data["printername"]
        printername = printnamedict["0"]
        for p in win32print.EnumPrinters(win32print.PRINTER_ENUM_LOCAL,
                                               None, 1):
            if (p[2] == printername):
                printdefaults = {"DesiredAccess": win32print.PRINTER_ALL_ACCESS}

                level = 2


                raw_data = bytes(print_cmds,"utf-8")

                hPrinter = win32print.OpenPrinter(p[2], printdefaults)

                try:
                    hJob = win32print.StartDocPrinter(hPrinter, 1, ("RFID tag print", None, "RAW"))
                    try:
                        win32print.StartPagePrinter(hPrinter)
                        win32print.WritePrinter(hPrinter, raw_data)
                        win32print.EndPagePrinter(hPrinter)
                    finally:
                        win32print.EndDocPrinter(hPrinter)
                finally:

                    win32print.ClosePrinter(hPrinter)

class PrintData:
    def __init__(self):
        self.products = dict()
        self.get_data()


    def get_data(self):
        root = tk.Tk()
        ToFrom(root).grid()
        root.mainloop()
      
        root.destroy()

        fromsr = inputdata['From']
        tosr = inputdata['To']

        query = "SELECT {},{},{},{} FROM {} WHERE {} is NULL and product_id >= {} and product_id <= {} ".format('rfidTag','designNumber','netWeight','metalPurity',
            config_data['mysql']['table'], 'deleted_at', fromsr, tosr)
        self.products = list(execute_query(query, 1))

        if len(self.products) == 0:
            messagebox.showerror('Error!', 'Sr No is not present')
        else:
            PrintData.print_data(self)



    def print_data(self):
        zpldict = config_data["ZPL"]
        zpl0 = zpldict["0"]
        zpl1 = zpldict["1"]
        zpl2 = zpldict["2"]
        zpl3 = zpldict["3"]
        zpl4 = zpldict["4"]
        zpl5 = zpldict["5"]
        zpl6 = zpldict["6"]
        zpl7 = zpldict["7"]
        zpl8 = zpldict["8"]
        zpl9 = zpldict["9"]
        zpl10 = zpldict["10"]

        zpl = ""
        ctr = 1
        for product in self.products:

            product = list(product)

            zpl1new = zpl1.replace('recno', str(ctr))
            zpl2new = zpl2.replace('rfidTag',str(product[0]))
            zpl5new = zpl5.replace('designNumber',str(product[1]))
            zpl6new = zpl6.replace('netWeight',str(product[2]))
            zpl7new = zpl7.replace('rfidTag', str(product[0]))
            zpl8new = zpl8.replace('metalPurity',str(product[3]))

            zpl = zpl +"\n\n" + zpl0 + "\n\n" + zpl1new + "\n" + zpl2new + "\n" + zpl3 + "\n" + zpl4 +"\n" +  zpl5new + "\n" +zpl6new + "\n" + zpl7new + "\n" + zpl8new +  "\n" +zpl9 + "\n" + zpl10
            ctr = ctr + 1

        # print(zpl)

        printnamedict = config_data["printername"]
        printername = printnamedict["0"]
        for p in win32print.EnumPrinters(win32print.PRINTER_ENUM_LOCAL,
                                               None, 1):
            if (p[2] == printername):
                printdefaults = {"DesiredAccess": win32print.PRINTER_ALL_ACCESS}

                level = 2


                raw_data = bytes(zpl,"utf-8")

                hPrinter = win32print.OpenPrinter(p[2], printdefaults)

                try:
                    hJob = win32print.StartDocPrinter(hPrinter, 1, ("RFID tag print", None, "RAW"))
                    try:
                        win32print.StartPagePrinter(hPrinter)
                        win32print.WritePrinter(hPrinter, raw_data)
                        win32print.EndPagePrinter(hPrinter)
                    finally:
                        win32print.EndDocPrinter(hPrinter)
                finally:

                    win32print.ClosePrinter(hPrinter)


class ToFrom(tk.Frame):
    def __init__(self, master=None, **kw):
        # Create a blank dictionary
        self.input = {}
        tk.Frame.__init__(self, master=master, **kw)
        self.winfo_toplevel().title("Enter Sr No")
        vcmd = (self.register(self.validate))

        tk.Label(self, text="From").grid(row=0, column=0, columnspan=1)
        self.fromsr = tk.Entry(self, validate='all', validatecommand=(vcmd, '%P'))
        self.fromsr.grid(row=0, column=1,padx=12, pady=10)

        tk.Label(self, text="To").grid(row=1, column=0, columnspan=1)
        self.tosr = tk.Entry(self, validate='all', validatecommand=(vcmd, '%P'))
        self.tosr.grid(row=1, column=1,padx=12, pady=10)

        tk.Button(self, text="Print/Export", command=self.getfromto).grid(row=2, column=0,padx=5, pady=5)
        tk.Button(self, text="Cancel", command=self.master.destroy).grid(row=2, column=1,padx=5, pady=5)

    def validate(self, P):
        if str.isdigit(P) or P == "":
            return True
        else:
            return False

    def getfromto(self):
        self.input['From'] = self.fromsr.get()
        self.input['To'] = self.tosr.get()
        if self.input['From'] == "" or self.input['To'] == "":
            messagebox.showerror('Error!', 'Please enter both From and To values')
        elif int(self.input['From']) > int(self.input['To']):
            messagebox.showerror('Error!', 'From value cannot be greater than To value')
        else:
            global inputdata
            inputdata = self.input
            tk.Frame.quit(self)

class FrameButtons:
    """Generates different buttons and links to corresponding classes"""

    def __init__(self, master):
        self.frame = tk.Frame(master, bg='#bd9e6f')
        self.insert_product = tk.Button(self.frame, text='SAVE', width=20, height=5, command=self.call_insert_product)
        self.insert_print_product = tk.Button(self.frame, text='SAVE & PRINT', width=20, height=5, command=self.call_insert_print_product)
        # self.edit_product = tk.Button(self.frame, text='EDIT', width=20, height=5,
        #                               command=self.call_edit_product)
        self.delete_product = tk.Button(self.frame, text='LIST/DELETE PRODUCTS', width=20, height=5,
                                        command=self.call_delete_products)
        # self.generate_excel = tk.Button(self.frame, text='GENERATE EXCEL', width=20, height=5,
        #                                 command=self.call_generate_excel)
        # self.print_product = tk.Button(self.frame, text='PRINT', width=20, height=5, command=self.call_print_product)
        self.edit_defaults = tk.Button(self.frame, text='EDIT DEFAULTS', width=20, height=5,
                                       command=self.call_edit_defaults)
        self.delete_perm = tk.Button(self.frame, text='DELETE ALL', width=20, height=5, command=self.call_delete_perm)

        self.exit = tk.Button(self.frame, text='EXIT', width=20, height=5, command=master.destroy)
        self.edit_configuration = tk.Button(self.frame, text='EDIT CONFIG', width=20, height=5, command=self.call_edit_config)

        self.insert_product.grid(row=0, column=0, padx=10, pady=10)
        self.insert_print_product.grid(row=0, column=1, padx=10, pady=10)
        # self.edit_product.grid(row=1, column=0, padx=10, pady=10)
        self.delete_product.grid(row=1, column=0, padx=10, pady=10)
        # self.generate_excel.grid(row=1, column=1, padx=10, pady=10)
        # self.print_product.grid(row=2, column=0, padx=10, pady=10)
        self.edit_defaults.grid(row=2, column=1, padx=10, pady=10)
        self.delete_perm.grid(row=1, column=1, padx=10, pady=10)
        
        self.edit_configuration.grid(row=2, column=0, padx=10, pady=10)
        self.exit.grid(row=3, column=0, padx=10, pady=10)

        self.frame.pack(side='top', padx=40, pady=20)

    def call_insert_product(self):
        InsertProduct()

    def call_insert_print_product(self):
        InsertPrintProduct()

    def call_edit_product(self):
        EditProduct()

    def call_delete_products(self):
        app.master.unbind("<KeyPress>")
        app.master.unbind("<KeyRelease>")
        DeleteProducts()

    def call_generate_excel(self):
        GenerateExcel()

    def call_print_product(self):
        PrintData()

    def call_edit_defaults(self):
        app.master.unbind("<KeyPress>")
        app.master.unbind("<KeyRelease>")
        EditDefaults()

    def call_edit_config(self):
        app.master.unbind("<KeyPress>")
        app.master.unbind("<KeyRelease>")
        EditConfig()

    def call_delete_perm(self):
        DeletePerm()


class Setup:
    """Setup the app and initialise all defaults"""

    def __init__(self, master):
        self.master = master
        root.bind("<KeyPress>", keydown)
        root.bind("<KeyRelease>", keyup)
        get_config()
        self.get_fields()
        self.title = tk.Label(master, text='DIVA', anchor='w', fg='#ffffff', bg='#bd9e6f', pady=20, font='ARIAL 42')
        self.title.pack()
        self.frame_form = FrameForm(self.master)
        self.frame_buttons = FrameButtons(self.master)

    def get_fields(self):
        """Get all fields present in the database"""
        query = "SELECT * FROM products WHERE rfidTag = ''"
        global fields
        fields = execute_query(query, 2)

        if 'defaults' not in config_data:
            # Editing configuration file to have default fields according to the database
            defaults = dict()
            for field in fields:
                defaults[field] = ""
            config_data['defaults'] = defaults
            update_config()


if __name__ == '__main__':
    root = tk.Tk()
    app = Setup(root)
    root.configure(bg='#bd9e6f')
    root.attributes('-fullscreen', False)
    root.mainloop()
