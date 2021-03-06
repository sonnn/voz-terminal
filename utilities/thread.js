const cheerio = require('cheerio-without-node-native');
const { GET } = require('./http');
const { parseDateTime } = require('./index.js');

const FORUM_URL = 'https://vozforums.com';

function parseThreadList(response) {
  const threadTDs = cheerio('#threadslist tbody[id^="threadbits_forum"] tr td[id^="td_threadtitle_"]', response);
  const threads = [];
  threadTDs.each((idx, td) => {
    const id = td.attribs.id.match(/\d+/)[0];
    const titleLink = cheerio(td).find('>div a[id^="thread_title_"]');
    const title = titleLink ? titleLink.text() : '';

    const links = cheerio(td).find('>div span > a');
    const lastPageLink = links.eq(links.length - 1);
    const lastPageHref = lastPageLink && lastPageLink.attribs ? lastPageLink.attribs.href: null; 
    let lastPage = 1;
    
    if (lastPageHref) {
      const match = lastPageHref.match(/&page=(\d+)/);
      if (match) lastPage = match[1];
    }
    
    threads.push({ id, pageNum: parseInt(lastPage, 10), title });
  });
  return threads;
}

function parsePageNum(response) {
  const pageTexts = cheerio('.pagenav td.vbmenu_control', response);
  if (pageTexts) {
    const text = pageTexts.eq(0).text();
    const match = text.match(/(\d+)\sof\s(\d+)/);
    if (match) return parseInt(match[2], 10);
  }
  return 1;
}

async function getThreadList(id, pageNum = 0) {
  try {
    const url = pageNum > 1 ? `${FORUM_URL}/forumdisplay.php?f=${id}&page=${pageNum}` : `${FORUM_URL}/forumdisplay.php?f=${id}`;
    const response = await GET(url);
    return [parseThreadList(response), parsePageNum(response)];
  } catch (error) {
    return [[], 0];
  }
}

module.exports = {
  getThreadList,
  parsePageNum,
  parseThreadList,
};
