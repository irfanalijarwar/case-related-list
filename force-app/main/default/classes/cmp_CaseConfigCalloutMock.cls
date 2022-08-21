@isTest
global class cmp_CaseConfigCalloutMock implements HttpCalloutMock {
	global HttpResponse respond(HttpRequest req){
        HttpResponse res = new HttpResponse();
        res.setHeader('Content-Type','application/json');
        res.setBody('{"status":"Closed","caseId":"5005g00000Tg4iJAAR","caseConfigs":[{"type":"t10","label":"test 10","amount":200.00},{"type":"abc","label":"xyz","amount":10.00}]}');
        res.setStatusCode(200);
        return res;
    }
}