with open(r'C:\Users\yashr\Downloads\sahijob-profile-tabs.html', 'r', encoding='utf-8') as f:
    text = f.read()

start = text.find('<style>') + len('<style>')
end = text.find('</style>')
css = text[start:end]

with open('tabs_style.css', 'w', encoding='utf-8') as f:
    f.write(css)

print("Saved tabs_style.css, length:", len(css))
