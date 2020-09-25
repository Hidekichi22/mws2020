// 金融機関のHPのHeadにありがちなワードのリストを読み込む
function readFinanceWordlist() {
    let wlist = [];
    let rawFile = new XMLHttpRequest();
    rawFile.open('GET', '/finance_wordlist.json', true);
    rawFile.onload = () => {
        let wjson = JSON.parse(rawFile.responseText);
        for (var i in wjson) { wlist.push(wjson[i]); }
    }
    rawFile.send();
    return wlist;
}

// フィルタでバッファにためたデータをデコードする
function bufferDecoder(data, chartype) {
    let decoder = new TextDecoder(chartype);
    let str = '';
    for (let buffer of data) { str += decoder.decode(buffer, {stream: true}); }
    str += decoder.decode();
    return str;
}

// Htmlの文字コードを取得する
function getChartype(str) {
    let s = str.replace(/(\s+|\/|\"|\')/gm, ''); // 空白, /, ", ' を削除
    let is_charset = s.match(/charset=.*/);
    if (is_charset != null) { return is_charset[0].split('>')[0].split('=')[1].toLowerCase(); }
    else { return 'utf-8'; }
}

// HtmlのHeadタグを抽出する
function getHead(str) {
    let s = str.replace(/(\s+|\r\n|\n|\r)/gm, ''); // 空白, 改行を削除
    let head = s.match(/<head>.*<\/head>/);
    if (head != null) { return head[0]; }
    else { return false; }
}
