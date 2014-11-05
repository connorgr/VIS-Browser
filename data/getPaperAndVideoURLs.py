# First check the data to find the number of InfoVis, SciVis, and VAST papers
import csv
conferences = ['VAST', 'InfoVis', 'SciVis']
numPapers = []

def unicode_csv_reader(utf8_data, dialect=csv.excel, **kwargs):
    csv_reader = csv.reader(utf8_data, dialect=dialect, **kwargs)
    for row in csv_reader:
        yield [unicode(cell, 'utf-8') for cell in row]

filename = 'schedule.csv'
reader = unicode_csv_reader(open(filename))

# http://stackoverflow.com/questions/11066400 necessary for title inconsistencies
import regex as re
def remove_punctuation(text):
    return re.sub(ur"\p{P}+", "", text)

for r in reader:
  if r[0] in conferences and 'Papers' in r[-1] and 'Session' not in r[-1]:
    numPapers.append( ''.join(remove_punctuation(r[3].strip().lower()).split()) )

print 'Number of events:', len(numPapers)


from bs4 import BeautifulSoup

import urllib2

url = "http://ieeevis.org/year/2014/info/overview-amp-topics/paper-sessions"

page = urllib2.urlopen(url)

soup = BeautifulSoup(page.read())


ps = soup.find(id="node-3011").find('div').find_all('p')

# Get rid of the section headers
events = filter(lambda p: False if p.find('a') and p.find('a').attrs and 'name' in p.find('a').attrs else True, ps)
events = filter(lambda p: len(p.findChildren()) > 0, events)
sessions = filter(lambda p: True if p.find('a') and p.find('a').attrs and 'name' in p.find('a').attrs else False, ps)
print len(events), len(ps)

# Remove weird edge cases
events = filter(lambda p: 'TUESDAY' not in p.findChildren()[0].contents[0], events)
events = filter(lambda p: len(p.findChildren()) > 3, events)

papers = []
http = unicode('http')
for e in events:
  content = e.findChildren()
  content = filter(lambda c: len(c.findChildren()) is 0, content) # get rid of award tags
  content = filter(lambda c: c.name != 'br', content)

  rawData = [c.attrs['href'] if c.name == 'a' else c.contents[0] for c in content]
  rawData = [unicode(d) for d in rawData]
  rawData = filter(lambda d: 'AWARD' not in d, rawData) # get rid of differently labeled award tags


  tmpPaper = [rawData[0]]

  for d in rawData[1:]:
    if http in d:
      tmpPaper.append(d)
    else:
      papers.append(tmpPaper)
      tmpPaper = [d]
  papers.append(tmpPaper)

papers = filter(lambda p: p != None, papers)


vimeo = unicode('vimeo')
ieee = unicode('ieeexplore.ieee.org')
titleToLinks = {}
def convertPaperToObj(paper):
  entry = {}
  title = ''.join(remove_punctuation(paper[0].strip().lower()).split())
  if '#' in title:
    print title
  title = title.replace('#','')
  entry['title'] = title
  titleToLinks[title] = {}
  if len(paper) > 1:
    for p in paper[1:]:
      if vimeo in p:
        entry['video'] = p
        titleToLinks[title]['video'] = p
      elif ieee in p:
        entry['pdf'] = p
        titleToLinks[title]['pdf'] = p
      else:
        print p
  return entry

# Provides an alternative to the titleToLinks object, if desired
paperObjs = [convertPaperToObj(p) for p in papers]

print '================================='
print 'Known papers:', len(numPapers)
print 'Found papers:', len(paperObjs)

print ''
print 'Not found papers...'
notFound = filter(lambda p: p['title'] not in numPapers, paperObjs)
print [n['title'] for n in notFound]

import io
import json
# HUGE hattip to http://stackoverflow.com/questions/18337407
with io.open('videos.json', 'w', encoding='utf8') as json_file:
  data = json.dumps(titleToLinks, ensure_ascii=False).encode('utf8')
  try:
    json_file.write(data)
  except TypeError:
    json_file.write(data.decode('utf8'))