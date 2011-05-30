#!/usr/bin/python
# -*- coding: utf-8 -*-
"""Compile script."""



import datetime
import urllib2
import re



RELEASE_FILE = './releases/blackbeard%s.html' % datetime.datetime.now().strftime('_ver%Y-%m-%d')

HTML_FILE = './src/blackbeard.html'

CSS_FILES = ('https://github.com/Littlemaple/css/raw/master/base.css',
             './src/style.css')

JAVASCRIPT_FILES = ('http://ajax.googleapis.com/ajax/libs/jquery/1.6.1/jquery.min.js',
                    './src/app.js')

LOGO_FILE = 'https://github.com/Littlemaple/blackbeard/raw/master/static/logo.jpg'



def get_file_contents(file):
    if re.match(r'https?://', file):
        f = urllib2.urlopen(file)
        contents = f.read()
    else:
        with open(file, 'r') as f:
            contents = f.read()
    if isinstance(contents, basestring):
        if not isinstance(contents, unicode):
            contents = unicode(contents, 'utf-8')
    return contents

def compress_css(css_code):
    css_code = re.sub(r'/\*[^*]*\*+([^/][^*]*\*+)*/', '', css_code)
    css_code = re.sub(r'[\r\n\t]+', '', css_code)
    css_code = re.sub(r' +', ' ', css_code)
    return css_code.strip()

template = get_file_contents(HTML_FILE)
data = {'logo': LOGO_FILE}

css = ''
for f in CSS_FILES:
    css += get_file_contents(f) + '\n\n'
data['css'] = compress_css(css)
    
javascript = ''
for f in JAVASCRIPT_FILES:
    javascript += get_file_contents(f) + '\n\n'
data['javascript'] = javascript.strip()



def replace(match):
    global data
    match = match.group(1)
    return data[match]

def file_put_contents(file, contents):
    with open(file, 'w') as f:
        f.write(contents.encode('utf-8'))
    
template = re.sub(r'{(\w+)}', replace, template)
file_put_contents(RELEASE_FILE, template)


