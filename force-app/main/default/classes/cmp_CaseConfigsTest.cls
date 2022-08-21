@isTest
public class cmp_CaseConfigsTest {
    @isTest
     static void testMakeCallout(){
         
         Test.setMock(HttpCalloutMock.class, new cmp_CaseConfigCalloutMock());
        
        Test.startTest();
        
        Case cases = new Case();
        cases.Subject = 'Test Subject';
        cases.Status = 'Submitted';
        cases.Origin = 'Email';
        insert cases;
        String caseID = cases.Id;
        
        Case_Config__c caseConfig = new Case_Config__c();
        caseConfig.Label__c = 'Test Case Lable';
        caseConfig.Type__c = 'Test case type';
        caseConfig.Amount__c = 30.00;
        caseConfig.Case__c = cases.Id;
        insert caseConfig;
         
         Test.stopTest();
        
        cmp_CaseConfigs.getCaseConfigs(caseID);
        
        cmp_CaseConfigs.updateCaseStatus(caseID);
        
        cmp_CaseConfigs.makePostCallout(caseID);
        
    }

}