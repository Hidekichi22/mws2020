function confirmTransmission(){
	var result = window.confirm('警告\nあなたがアクセスしようとしているサイトはフィッシングサイトの可能性が高いです。キャンセルをクリックして戻ることを強く推奨します。');
	if (result) {
		console.log('OKがクリックされました');
	} else {
		console.log('キャンセルがクリックされました');
		window.history.back();
	}
}
