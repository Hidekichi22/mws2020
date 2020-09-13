function html_filter(requestDetails){
    let filter = browser.webRequest.filterResponseData(requestDetails.requestId);
    let encoder = new TextEncoder();
    let decoder = new TextDecoder('utf-8');
    let data = [];

    filter.ondata = event => {    // データを受け取ったら(パケットに小分けされて何回も受け取る)
        data.push(event.data);    // データをスタックに積む
        filter.write(event.data); // データをブラウザにわたす
    }

    filter.onstop = event => {    // データをすべて受け取り終わったら
        // スタックに積んだデータを文字列にデコード
        let str = '';
        for (let buffer of data) {
            str += decoder.decode(buffer, {stream: true});
        }
        str += decoder.decode(); // end-of-stream

        // 空白, 改行を削除
        str = str.replace(/(\s+|\r\n|\n|\r)/gm,'');
        // headタグを抽出
        str = str.match(/<head>.*<\/head>/)[0];

        // ここに機能を追加する
        console.log(str);

        filter.close();           // フィルタオブジェクトを終了する
    }

    // 証明書関係 参考
    // https://developer.mozilla.org/ja/docs/Mozilla/Add-ons/WebExtensions/API/webRequest/getSecurityInfo
    // https://developer.mozilla.org/ja/docs/Mozilla/Add-ons/WebExtensions/API/webRequest/CertificateInfo
    //console.log(browser.getSecurityInfo(requestDetails.requestId))
}

browser.webRequest.onBeforeRequest.addListener(
    // callback: このイベントが発生したときに呼び出される関数
    html_filter,
    // filter: このリスナーに送信されるイベントを制限するフィルタ
    {urls:['*://*/*'],types:['main_frame']},
    // blocking: リクエストを同期化して、リクエストをキャンセルまたはリダイレクトできるようにする
    ['blocking']
);
