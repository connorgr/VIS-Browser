import csv

empty = unicode('')

header = []
events = []

# thanks to http://stackoverflow.com/questions/904041
def unicode_csv_reader(utf8_data, dialect=csv.excel, **kwargs):
    csv_reader = csv.reader(utf8_data, dialect=dialect, **kwargs)
    for row in csv_reader:
        yield [unicode(cell, 'utf-8') for cell in row]

filename = 'schedule.csv'
reader = unicode_csv_reader(open(filename))


day = ''
header = reader.next()
for row in reader:
  if row[0] is empty and unicode('2014') in row[2]:
    day = row[2]
    continue
  elif row[0] is empty:
    continue

  events.append([day] + row)

header = [unicode('Day')] + header
jsonEvents = [dict(zip(header,event)) for event in events]

import io
import json

# HUGE hattip to http://stackoverflow.com/questions/18337407
with io.open('schedule.json', 'w', encoding='utf8') as json_file:
  data = json.dumps(jsonEvents, ensure_ascii=False).encode('utf8')
  try:
    json_file.write(data)
  except TypeError:
    json_file.write(data.decode('utf8'))