html = '''            <!-- Calendar Grid -->
            <div class="glass-panel" style="padding: 1.5rem; margin-bottom: 2rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                    <h3 style="color: var(--text-main);">Year 2026 Calendar</h3>
                    <div style="display: flex; gap: 1rem; font-size: 0.8rem;">
                        <span style="display: flex; align-items: center; gap: 0.5rem;"><div style="width:12px; height:12px; border-radius:3px; background:rgba(255,255,255,0.05);"></div> Weekend</span>
                        <span style="display: flex; align-items: center; gap: 0.5rem;"><div style="width:12px; height:12px; border-radius:3px; background:rgba(16,185,129,0.2);"></div> Holiday</span>
                        <span style="display: flex; align-items: center; gap: 0.5rem;"><div style="width:12px; height:12px; border-radius:3px; background:rgba(245,158,11,0.2);"></div> Leave</span>
                    </div>
                </div>
                
                <table style="width: 100%; border-collapse: collapse;">
                    <tbody>'''

months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

for i, month in enumerate(months):
    html += f'''
                        <!-- {month} -->
                        <tr onclick="this.nextElementSibling.style.display = this.nextElementSibling.style.display === 'none' ? 'table-row' : 'none'" style="cursor: pointer; border-bottom: 1px solid rgba(255,255,255,0.05);">
                            <td style="padding: 1rem; font-weight: 600; color: var(--text-main);">{month} 2026</td>
                            <td style="text-align: right; padding: 1rem; color: var(--text-muted);"><i class="fa-solid fa-chevron-down"></i></td>
                        </tr>
                        <tr style="display: none;">
                            <td colspan="2" style="padding: 1.5rem 0;">
                                <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 0.5rem; text-align: center;">
                                    <div style="font-weight: 600; color: var(--text-muted); padding-bottom: 0.5rem;">Sun</div>
                                    <div style="font-weight: 600; color: var(--text-muted); padding-bottom: 0.5rem;">Mon</div>
                                    <div style="font-weight: 600; color: var(--text-muted); padding-bottom: 0.5rem;">Tue</div>
                                    <div style="font-weight: 600; color: var(--text-muted); padding-bottom: 0.5rem;">Wed</div>
                                    <div style="font-weight: 600; color: var(--text-muted); padding-bottom: 0.5rem;">Thu</div>
                                    <div style="font-weight: 600; color: var(--text-muted); padding-bottom: 0.5rem;">Fri</div>
                                    <div style="font-weight: 600; color: var(--text-muted); padding-bottom: 0.5rem;">Sat</div>
'''
    # Empty slots
    for _ in range((i + 3) % 7):
        html += '                                    <div></div>\n'
    
    # Days
    for d in range(1, 29 + (i%2)*2):
        bg = 'rgba(255,255,255,0.02)'
        color = ''
        title = ''
        is_weekend = (d + (i+3)%7) % 7 in [1, 0] # 1 is Sun, 0 is Sat
        
        if is_weekend:
            bg = 'rgba(255,255,255,0.05)'
            color = 'color: var(--text-muted);'
            title = ' title="Weekend"'
        
        # Add some mock holidays and leaves based on month
        if month == 'October' and d == 12:
            bg = 'rgba(16,185,129,0.2)'
            color = 'color: #10b981; font-weight:bold;'
            title = ' title="Holiday"'
        elif month == 'October' and d in [10, 23, 24]:
            bg = 'rgba(245,158,11,0.2)'
            color = 'color: #f59e0b; font-weight:bold;'
            title = ' title="Leave"'
        elif month == 'January' and d == 1:
            bg = 'rgba(16,185,129,0.2)'
            color = 'color: #10b981; font-weight:bold;'
            title = ' title="New Year"'
            
        html += f'                                    <div style="padding: 1rem 0; border-radius: 8px; background: {bg}; {color}"{title}>{d}</div>\n'
        
    html += '''                                </div>
                            </td>
                        </tr>'''

html += '''
                    </tbody>
                </table>
            </div>'''

with open('calendar.txt', 'w') as f:
    f.write(html)
