import { api, LightningElement, track, wire } from 'lwc';
import getCaseConfigs from '@salesforce/apex/cmp_CaseConfigs.getCaseConfigs';
import updateCaseStatus from '@salesforce/apex/cmp_CaseConfigs.updateCaseStatus';
import makePostCallout from '@salesforce/apex/cmp_CaseConfigs.makePostCallout';
import { registerListener, unregisterAllListeners } from 'c/pubsub';
import { CurrentPageReference } from 'lightning/navigation';
import { refreshApex } from '@salesforce/apex';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { fireEvent } from 'c/pubsub';
import { getConfirmation, handleConfirmationButtonClick } from 'c/lwcModalUtil';

const columns=[  
    {label:'Label',fieldName:'Label__c', type:'text', sortable: true},  
    {label:'Type',fieldName:'Type__c', type:'text', sortable: true},  
    {label:'Amount',fieldName:'Amount__c', type:'number', sortable: true}  
  ]; 
export default class Lwc_CaseConfigs extends LightningElement {
    @track columns = columns;
    error;
    @track sortDirection;
    @track sortedBy;
    @api recordId;
    @track CaseConfigList = [];
    TotalList;
    @track load = false;
    @track confirmation;

    AddConfirmationDetails = {
        text: 'Are you sure want to data to external application?',
        confirmButtonLabel: 'Yes',
        confirmButtonVariant: 'success',
        cancelButtonLabel: 'No',
        header: 'Confirm Add'
    };

    // We pass the event to the function imported from the utility class along with the confirmation object
    handleModalButtonClick(event) {
        handleConfirmationButtonClick(event, this.confirmation);
    }

@wire(getCaseConfigs,{ caseID : '$recordId'})
wiredConfigs(result){
    this.TotalList = result;
    if(result.data){
        this.CaseConfigList = result.data;
        this.error = undefined;
        this.load = true;
    } else if(result.error){
        this.error = result.error;
        this.CaseConfigList = undefined;
        this.load = true;
    }
}

renderedCallback(){
    this.RefreshPage(this.TotalList);
}

@wire(CurrentPageReference) pageRef;
connectedCallback() {
    registerListener("eventdetails", this.RefreshPage, this); 
    console.log('event regist');

} 

disconnectedCallback() { 

    unregisterAllListeners(this); 

}

RefreshPage(data){
    var ss = data;
    return refreshApex(this.TotalList);
}

@wire(CurrentPageReference) pageRef;
notifyConfigs(){
    fireEvent(this.pageRef, "eventdetails", "Disable");
    console.log('event fire');
}

onHandleSend(){
    this.confirmation = getConfirmation(
        this.AddConfirmationDetails,
        () => this.UpdateCase()
    );
        
}

UpdateCase(){
    this.load = false;
    updateCaseStatus({
        caseID : this.recordId
    }).then (result => {
        if(result == 'Case Updated'){
            this.MakeCallToExternal();
        } else {
            this.dispatchEvent(
                new ShowToastEvent({
                    title : 'Info!',
                    message : result,
                    variant : 'error'
                })
            );
            this.load = true;
        }
    });
}

MakeCallToExternal(){
    makePostCallout({
        caseID : this.recordId
    }).then(result => {
        this.dispatchEvent(
            new ShowToastEvent({
                title : 'Info!',
                message : 'Request has been sent to External! Now you can not add Configs to Case.',
                variant : 'success'
            })
        );
        this.notifyConfigs();
        this.load = true;
        this.UpdateRecordView();
    })
}

UpdateRecordView(){
    eval("$A.get('e.force:refreshView').fire();");
}

// Used to handle the sorting
onHandleSort(event) {
    const { fieldName: sortedBy, sortDirection } = event.detail;
    const cloneData = [...this.CaseConfigList];

    cloneData.sort(this.sortBy(sortedBy, sortDirection === 'asc' ? 1 : -1));
    this.CaseConfigList = cloneData;
    this.sortDirection = sortDirection;
    this.sortedBy = sortedBy;
}

// Used to sort the column
sortBy(field, reverse, primer) {
    const key = primer
        ? function (x) {
              return primer(x[field]);
          }
        : function (x) {
              return x[field];
          };
          this.load = true;

    return function (a, b) {
        a = key(a);
        b = key(b);
        return reverse * ((a > b) - (b > a));
    };
}
}