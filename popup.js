var html = document.body.innerHTML	//html取得
var str = '<script';			//検索文字列
console.log(html);			//動作確認用
if(html.includes(str)){			//取得したhtmlに'<script'が含まれているか
	console.log(str.includes(str));	//動作確認用
	var result = window.confirm('JavaScriptが起動しようとしています。よろしいですか？');	//許可不許可ポップアップ
		if( result ) {		
    			console.log('OKがクリックされました');	//動作確認用
   		}
    		else {
     			console.log('キャンセルがクリックされました');	//動作確認用
			$('a').click(function(e){　//ここから遷移中止動作
				e.preventDefault();
			});
			//window.location.href = 'https://www.google.co.jp/'; // 動作テスト用にgoogleに飛びます
   		}

}