public with sharing class cmp_CaseConfigs {

    @AuraEnabled(cacheable=true)
    public static List<Case_Config__c> getCaseConfigs(String caseID){
        List<Case_Config__c> c = new List<Case_Config__c>();
        c = [SELECT Id, Label__c, Type__c, Amount__c FROM Case_Config__c WHERE Case__c =: caseID];
        return c;
    }

    @AuraEnabled 
    public static String updateCaseStatus(String caseID){
        String msg;
        List<Case> cases = new List<Case>();
        cases = [SELECT Id, Status FROM Case WHERE Id =: caseID];
        cases[0].Status = 'Closed';
        try {
            update cases;
            msg = 'Case Updated';
        } catch (Exception e) {
            msg = e.getMessage();
        }
        return msg;
    }

    @AuraEnabled
    public static void makePostCallout(String caseID){
        MakePostWrapper reqBody = new MakePostWrapper();
        List<Case> caseDetails = new List<Case>();
        caseDetails = [SELECT Id, Status FROM Case WHERE Id =: caseID];
        reqBody.caseId = caseDetails[0].Id;
        reqBody.status = caseDetails[0].Status;
        List<Case_Config__c> caseConfig = new List<Case_Config__c>();
        caseConfig = [SELECT Label__c, Type__c, Amount__c FROM Case_Config__c WHERE Case__c =: caseID];
        List<cls_caseConfigs> clsCaseConfig = new List<cls_caseConfigs>();
        for(Case_Config__c c: caseConfig){
            cls_caseConfigs cl = new cls_caseConfigs();
            cl.label = c.Label__c;
            cl.type = c.Type__c;
            cl.amount = c.Amount__c;
            clsCaseConfig.add(cl);
        }
        reqBody.caseConfigs = clsCaseConfig;
        try {
            HttpResponse response = sendToExternal(JSON.serialize(reqBody));
            if(response.getStatusCode() == 200) {
                System.debug('The status code returned is : ' +
                    response.getStatusCode() + ' ' + response.getStatus());
            } else {
                System.debug(response.getBody());
            }
        } catch (System.CalloutException e) {
            System.debug('EROOR : '+e.getMessage());
        }
    }

    
    public static HttpResponse sendToExternal(String reqBody) {
        Http http = new Http();
        HttpRequest request = new HttpRequest();
        request.setEndpoint('https://mydev.requestcatcher.com/test');
        request.setMethod('POST');
        request.setHeader('Content-Type', 'application/json;charset=UTF-8');
        request.setBody(reqBody);
        HttpResponse response = http.send(request);
        return response;

    }

    public class MakePostWrapper {
        public String caseId;
        public String status;
        public cls_caseConfigs[] caseConfigs;
    }

    public class cls_caseConfigs {
            public String label;
            public String type;
            public Decimal amount;
        }
}
