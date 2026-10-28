with open(r'C:\Users\yashr\Downloads\sahijob-profile-v2.html', 'r', encoding='utf-8') as f:
    text = f.read()

idx = text.find('#xseg')
while idx != -1:
    print("--- MATCH AT", idx, "---")
    print(text[max(0, idx-60):min(len(text), idx+200)])
    idx = text.find('#xseg', idx+1)
