let security_info = browser.webRequest.getSecurityInfo(requestId, certificateChain=True)
security_info.CertificateInfo()
