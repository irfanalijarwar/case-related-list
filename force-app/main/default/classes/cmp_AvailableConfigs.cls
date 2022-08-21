public with sharing class cmp_AvailableConfigs {

    @AuraEnabled(cacheable=true)
    public static List<Config__c> getAvailableConfigs(){
        String sql = 'SELECT Id, Label__c, Type__c, Amount__c FROM Config__c';
        List<Config__c> c = new List<Config__c>();
        c = Database.query(sql);
        return c;
    }

    @AuraEnabled 
    public static String getCaseStatus(String caseID){
        List<Case> cases = new List<Case>();
        cases = [SELECT Id, Status FROM Case WHERE Id =: caseID];
        String status = cases[0].Status;
        return status;
    }

    @AuraEnabled
    public static List<Case_Config__c> checkCaseConfigs(List<String> configRecords, String recID){
        List<Case_Config__c> caseConfigs = new List<Case_Config__c>();
        caseConfigs = [SELECT Id, Label__c, Case__c FROM Case_Config__c WHERE Label__c IN :configRecords AND Case__c = :recID];
        return caseConfigs;
    }

    @AuraEnabled
    public static string addCaseConfig(List<String> recordDetails, String caseID){
        String msg;
        List<Config__c> configs = [SELECT Id, Label__c, Type__c, Amount__c FROM Config__c WHERE Label__c IN :recordDetails];
        List<Case_Config__c> caseConfigToAdd = new List<Case_Config__c>();
        for(integer i=0; i<configs.size(); i++){
            Case_Config__c cc = new Case_Config__c();
            cc.Label__c = configs[i].Label__c;
            cc.Type__c = configs[i].Type__c;
            cc.Amount__c = configs[i].Amount__c;
            cc.Case__c = caseID;
            caseConfigToAdd.add(cc);
        }
        if(caseConfigToAdd.size() > 0){
            try {
                Database.insert(caseConfigToAdd);
                //insert caseConfigToAdd;
                msg = 'Your selected record are added to Case.';
            } catch (System.DmlException e) {
                msg = e.getMessage();
            }
        }
        return msg;
    }
}
