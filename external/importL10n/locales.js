/* Copyright 2012 Mozilla Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

var fs = require('fs');
var https = require('https');
var path = require('path');

// Defines all languages that have a translation at mozilla-central.
// This is used in gulpfile.js for the `importl10n` command.
var langCodes = [
  'ach', 'af', 'ak', 'an', 'ar', 'ast', 'az', 'be', 'bg', 'bn-BD', 'bn-IN',
  'br', 'brx', 'bs', 'ca', 'cak', 'cs', 'csb', 'cy', 'da', 'de', 'el', 'en-CA',
  'en-GB', 'eo', 'es-AR', 'es-CL', 'es-ES', 'es-MX', 'et', 'eu', 'fa', 'ff',
  'fi', 'fr', 'fy-NL', 'ga-IE', 'gd', 'gl', 'gn', 'gu-IN', 'he', 'hi-IN', 'hr',
  'hsb', 'hto', 'hu', 'hy-AM', 'ia', 'id', 'is', 'it', 'ja', 'ka', 'kab', 'kk',
  'km', 'kn', 'ko', 'kok', 'ks', 'ku', 'lg', 'lij', 'lo', 'lt', 'ltg', 'lv',
  'meh', 'mk', 'mn', 'mr', 'ms', 'my', 'nb-NO', 'ne-NP', 'nl', 'nn-NO', 'nso',
  'oc', 'pa-IN', 'pl', 'pt-BR', 'pt-PT', 'rm', 'ro', 'ru', 'rw', 'sah', 'sat',
  'si', 'sk', 'sl', 'son', 'sq', 'sr', 'sv-SE', 'sw', 'ta', 'ta-LK', 'te', 'th',
  'tl', 'tn', 'tr', 'tsz', 'uk', 'ur', 'uz', 'vi', 'wo', 'xh', 'zam', 'zh-CN',
  'zh-TW', 'zu'
];

function normalizeText(s) {
  return s.replace(/\r\n?/g, '\n').replace(/\uFEFF/g, '');
}

function downloadLanguageFiles(root, langCode, callback) {
  console.log('Downloading ' + langCode + '...');

  // Constants for constructing the URLs. Translations are taken from the
  // Nightly channel as those are the most recent ones.
  var MOZ_CENTRAL_ROOT = 'https://hg.mozilla.org/l10n-central/';
  var MOZ_CENTRAL_PDFJS_DIR = '/raw-file/default/browser/pdfviewer/';

  // Defines which files to download for each language.
  var files = ['chrome.properties', 'viewer.properties'];
  var downloadsLeft = files.length;

  var outputDir = path.join(root, langCode);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  // Download the necessary files for this language.
  files.forEach(function(fileName) {
    var outputPath = path.join(outputDir, fileName);
    var url = MOZ_CENTRAL_ROOT + langCode + MOZ_CENTRAL_PDFJS_DIR + fileName;

    https.get(url, function(response) {
      // Not all files exist for each language. Files without translations have
      // been removed (https://bugzilla.mozilla.org/show_bug.cgi?id=1443175).
      if (response.statusCode === 200) {
        var content = '';
        response.setEncoding('utf8');
        response.on('data', function(chunk) {
          content += chunk;
        });
        response.on('end', function() {
          fs.writeFileSync(outputPath, normalizeText(content), 'utf8');
          downloadsLeft--;
          if (downloadsLeft === 0) {
            callback();
          }
        });
      } else {
        downloadsLeft--;
        if (downloadsLeft === 0) {
          callback();
        }
      }
    });
  });
}

function downloadL10n(root, callback) {
  var i = 0;
  (function next() {
    if (i >= langCodes.length) {
      if (callback) {
        callback();
      }
      return;
    }
    downloadLanguageFiles(root, langCodes[i++], next);
  })();
}

exports.downloadL10n = downloadL10n;
