function html_filter(requestDetails){
    let link_list = [];
    console.log(requestDetails.url);

    // Gmailへの遷移だったらメール上のリンクをとってくる
    if (requestDetails.url.split('/')[2] == 'mail.gmail.com'){
        let filter = browser.webRequest.filterResponseData(requestDetails.requestId);
        let decoder = new TextDecoder('utf-8');
        let data = [];

        filter.ondata = event => {    // データを受け取ったら(パケットに小分けされて何回も受け取る)
            data.push(event.data);    // データをスタックに積む
            filter.write(event.data); // データをブラウザにわたす
        }
        filter.onstop = event => {    // データをすべて受け取り終わったら            // スタックに積んだデータを文字列にデコード
            let str = '';
            for (let buffer of data) {
                str += decoder.decode(buffer, {stream: true});
            }
            str += decoder.decode(); // end-of-stream

            // 空白, 改行を改行に
            str = str.replace(/(\s+|\r\n|\n|\r|\"|\')/gm,'\n');
            // URLを取得
            link_list = str.match(/https+.*/gm);
            console.log(link_list);
            filter.close();           // フィルタオブジェクトを終了する
        }
    }

    // 遷移後がGmailでなく、遷移前がGmailだったらフィルタ処理
    else if (requestDetails.originUrl.split('/')[2] == 'mail.gmail.com' && link_list.includes(requestDetails.url)){
        let filter = browser.webRequest.filterResponseData(requestDetails.requestId);
        let decoder = new TextDecoder('utf-8');
        let data = [];

        filter.ondata = event => {    // データを受け取ったら(パケットに小分けされて何回も受け取る)
            data.push(event.data);    // データをスタックに積む
            filter.write(event.data); // データをブラウザにわたす
        }
        filter.onstop = event => {    // データをすべて受け取り終わったら            // スタックに積んだデータを文字列にデコード
            let str = '';
            for (let buffer of data) {
                str += decoder.decode(buffer, {stream: true});
            }
            str += decoder.decode(); // end-of-stream

            // 空白, 改行を削除
            str = str.replace(/(\s+|\r\n|\n|\r)/gm,'');
            // headタグを抽出
            let head = str.match(/<head>.*<\/head>/);
            // headタグがあれば次の処理に遷移
            if (head != null) {
                head = head[0];
                // ここにフィルタ処理を追加する
                console.log(head);
            }
            filter.close();           // フィルタオブジェクトを終了する
        }

        // 証明書
        browser.webRequest.onHeadersReceived.addListener(
            async function(requestDetails){
                try {
                    let securityInfo = await browser.webRequest.getSecurityInfo(
                        requestDetails.requestId,
                        {}
                    )
                    console.log(securityInfo)
                }
                catch(error){
                    console.error(error);
                }
            },
            {urls:['*://*/*'], types:['main_frame']}
        )
    }

    else{
        // gmail以外からだった時の処理(テスト用)
        console.log(requestDetails.url.split('/')[2]);
    }
}


browser.webRequest.onBeforeRequest.addListener(
    // callback: このイベントが発生したときに呼び出される関数
    html_filter,
    // filter: このリスナーに送信されるイベントを制限するフィルタ
    {urls:['*://*/*'], types:['main_frame']},
    // blocking: リクエストを同期化して、リクエストをキャンセルまたはリダイレクトできるようにする
    ['blocking']
);
