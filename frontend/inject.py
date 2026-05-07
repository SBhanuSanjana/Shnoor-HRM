import re

with open('calendar.txt', 'r') as f:
    cal_html = f.read()

for file_path in [r'frontend\employee\employee.html', r'frontend\manager\manager.html']:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # We want to replace everything from "<!-- Calendar Grid -->" up to the NEXT "<div class="table-container">"
    # Wait, the Calendar Grid block is exactly:
    # <!-- Calendar Grid --> ... </div>\n\n            <div class="table-container">
    # Actually, let's use a simpler string split or regex:
    
    # The calendar grid block starts with <!-- Calendar Grid -->
    # and ends right before <div class="table-container">
    # Wait, there are multiple "table-container" instances. So we should match carefully.
    
    new_content = re.sub(r'<!-- Calendar Grid -->.*?<div class="table-container">', cal_html + '\n\n            <div class="table-container">', content, flags=re.DOTALL)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
        
print('Done!')
