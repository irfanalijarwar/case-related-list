import { api, LightningElement, track, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { getConfirmation, handleConfirmationButtonClick } from 'c/lwcModalUtil';
import getAvailableConfigs from '@salesforce/apex/cmp_AvailableConfigs.getAvailableConfigs';
import checkCaseConfigs from '@salesforce/apex/cmp_AvailableConfigs.checkCaseConfigs';
import addCaseConfig from '@salesforce/apex/cmp_AvailableConfigs.addCaseConfig';
import getCaseStatus from '@salesforce/apex/cmp_AvailableConfigs.getCaseStatus';
import { registerListener, unregisterAllListeners } from 'c/pubsub';
import { fireEvent } from 'c/pubsub'; 
import { CurrentPageReference } from 'lightning/navigation';
import { refreshApex } from '@salesforce/apex';

const columns=[  
    {
        label:'Label',
        fieldName:'Label__c', 
        type:'text', 
        sortable: true
    },  
    {
        label:'Type',
        fieldName:'Type__c', 
        type:'text', 
        sortable: true
    },  
    {
        label:'Amount',
        fieldName:'Amount__c', 
        type:'number', 
        sortable: true
    }  
  ]; 
export default class Lwc_AvailableConfigs extends LightningElement {
    @api recordId;
    @track columns;
    @track load = false;
    @track sortDirection;
    @track sortedBy;
    error;
    @track configList = [];
    caseConfigs;
    @track confirmation;
    @track msg = '';
    listToCompare;
    result =[];
    @track value;
    @track allSelectedRows = [];
    @track page = 1; 
    @track items = []; 
    @track data = []; 
    @track columns; 
    @track startingRecord = 1;
    @track endingRecord = 0; 
    @track pageSize = 200; 
    @track totalRecountCount = 0;
    @track totalPage = 0;
    isPageChanged = false;
    initialLoad = true;
    mapoppNameVsOpp = new Map();
    totalRecords;
    @track disableButton = false;
    evtMsg = '';


    // We pass the event to the function imported from the utility class along with the confirmation object
    handleModalButtonClick(event) {
        handleConfirmationButtonClick(event, this.confirmation);
    }

    renderedCallback(){
        return refreshApex(this.totalRecords);
    }

    @wire(getAvailableConfigs)
    wiredConfigs(result){
        this.totalRecords = result;
        if(result.data){
            this.processRecords(result.data);
            this.getCaseStatus();
            this.error = undefined;
        } else if(result.error){
            this.configList = undefined;
            this.error = result.error;
            this.load = true;
        }
    }

    getCaseStatus(){
        getCaseStatus({
            caseID : this.recordId
        }).then (result => {
            if(result == 'Closed'){
                this.disableButton = true;
            }
        })
    }

    @wire(CurrentPageReference) pageRef;
    connectedCallback() {
    registerListener("eventdetails", this.setAddButton, this); 
    console.log('event regist');

} 

disconnectedCallback() { 

    unregisterAllListeners(this); 

}

setAddButton(data){
    this.evtMsg = data;
    if(this.evtMsg == 'Disable'){
        this.disableButton = true;
    }
    this.RefreshPage(this.totalRecords);
}

SaveRecord(){
    if(this.allSelectedRows.length > 0){
        this.load = false;
        console.log('Selected :: '+this.allSelectedRows.length);
        var selected = this.template.querySelector('[data-id="table"]').selectedRows;
        console.log('abc :'+selected);
        checkCaseConfigs({
            configRecords : selected,
            recID : this.recordId
        }).then(result => {
            this.caseConfigs = result;
            let counter = 0;
            result.forEach((rec) => {
                if(counter < result.length){
                this.msg = this.msg + rec.Label__c + ', ';
                this.listToCompare = rec.Label__c;
                }
                counter++;
            })
            if(this.caseConfigs.length != 0 && this.caseConfigs.length < this.allSelectedRows.length){
                this.load = true;
                var AddConfirmationDetails = {
                    text: 'Your selected record '+this.msg+'are already associated with this Case. Would you like to Add rest of records?',
                    confirmButtonLabel: 'Yes',
                    confirmButtonVariant: 'success',
                    cancelButtonLabel: 'No',
                    header: 'Confirm Add'
                };
                this.confirmation = getConfirmation(
                    AddConfirmationDetails, // modal configurations
                    () => this.AddRestRecords(this.listToCompare)
                );
                this.msg = '';
            } else if(this.caseConfigs.length == this.allSelectedRows.length) {
                this.load = true;
                this.dispatchEvent(
                    new ShowToastEvent({
                        title : 'Info!',
                        message : 'Your selected record '+this.msg+'are already associated with this Case. You can not add them again',
                        variant : 'error'
                    })
                );
                this.msg = '';
            } else {
                this.AddRecord();
            }
        })

    } else {
        this.dispatchEvent(
            new ShowToastEvent({
                title : 'Info!',
                message : 'Please select at least one record from Available Configs to add into Case.',
                variant : 'error'
            })
        );
    }
}

AddRecord(){
    var select = this.template.querySelector('[data-id="table"]').selectedRows;
    addCaseConfig({
        recordDetails : select,
        caseID : this.recordId
    }).then(result => {
        this.load = true;
        var variant = result == 'Your selected record are added to Case.' ? 'success' : 'error';
        this.dispatchEvent(
            new ShowToastEvent({
                title : 'Info!',
                message : result,
                variant : variant
            })
        );
            this.RefreshPage(this.totalRecords);
            this.notifyCaseConfigs();
    })
}
@wire(CurrentPageReference) pageRef;
notifyCaseConfigs(){
    fireEvent(this.pageRef, "eventdetails", "New record added");
    console.log('event fire');
}

AddRestRecords(data){
    var slct = this.template.querySelector('[data-id="table"]').selectedRows;
    slct = slct.filter(val => !data.includes(val));
    console.log('sl : '+slct);
    addCaseConfig({
        recordDetails : slct,
        caseID : this.recordId
    }).then(result => {
        this.dispatchEvent(
            new ShowToastEvent({
                title : 'Info!',
                message : result,
                variant : 'success'
            })
        );
        this.RefreshPage(this.totalRecords);
        this.notifyCaseConfigs();
    })
}

RefreshPage(data){
    console.log('refresh');
    this.allSelectedRows = [];
    return refreshApex(this.totalRecords);
    this.load = true;
}

// Used to handle the sorting
onHandleSort(event) {
    const { fieldName: sortedBy, sortDirection } = event.detail;
    const cloneData = [...this.configList];

    cloneData.sort(this.sortBy(sortedBy, sortDirection === 'asc' ? 1 : -1));
    this.configList = cloneData;
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

    return function (a, b) {
        a = key(a);
        b = key(b);
        return reverse * ((a > b) - (b > a));
    };
}

// used to process data with pagination
processRecords(data){
        this.items = data;
        this.totalRecountCount = data.length; 
        this.totalPage = Math.ceil(this.totalRecountCount / this.pageSize); 
        
        this.configList = this.items.slice(0,this.pageSize); 
        this.endingRecord = this.pageSize;
        this.columns = columns;
        this.load = true;
}

// Handle Previous Button
previousHandler() {
    this.load = false;
    this.isPageChanged = true;
    if (this.page > 1) {
        this.page = this.page - 1; //decrease page by 1
        this.displayRecordPerPage(this.page);
    }
      var selectedIds = [];
      for(var i=0; i<this.allSelectedRows.length;i++){
        selectedIds.push(this.allSelectedRows[i].Id);
      }
    this.template.querySelector(
        '[data-id="table"]'
      ).selectedRows = selectedIds;
      this.load = true;
}

// Handle Next button
nextHandler() {
    this.load = false;
    this.isPageChanged = true;
    if((this.page<this.totalPage) && this.page !== this.totalPage){
        this.page = this.page + 1; //increase page by 1
        this.displayRecordPerPage(this.page);            
    }
      var selectedIds = [];
      for(var i=0; i<this.allSelectedRows.length;i++){
        selectedIds.push(this.allSelectedRows[i].Id);
      }
    this.template.querySelector(
        '[data-id="table"]'
      ).selectedRows = selectedIds;
      this.load = true;
}

// Used to display the records according to pagination
displayRecordPerPage(page){

    this.startingRecord = ((page -1) * this.pageSize) ;
    this.endingRecord = (this.pageSize * page);

    this.endingRecord = (this.endingRecord > this.totalRecountCount) 
                        ? this.totalRecountCount : this.endingRecord; 

    this.configList = this.items.slice(this.startingRecord, this.endingRecord);
    this.startingRecord = this.startingRecord + 1;
}

// Used to handle row selection
onRowSelection(event){
    if(!this.isPageChanged || this.initialLoad){
        if(this.initialLoad) this.initialLoad = false;
        this.processSelectedRows(event.detail.selectedRows);
    }else{
        this.isPageChanged = false;
        this.initialLoad =true;
    }
    
}

// Used to handle selected row on the current page
processSelectedRows(selectedConfigs){
    var newMap = new Map();
    for(var i=0; i<selectedConfigs.length;i++){
        if(!this.allSelectedRows.includes(selectedConfigs[i])){
            this.allSelectedRows.push(selectedConfigs[i]);
        }
        this.mapoppNameVsOpp.set(selectedConfigs[i].Name, selectedConfigs[i]);
        newMap.set(selectedConfigs[i].Name, selectedConfigs[i]);
    }
    for(let [key,value] of this.mapoppNameVsOpp.entries()){
        if(newMap.size<=0 || (!newMap.has(key) && this.initialLoad)){
            const index = this.allSelectedRows.indexOf(value);
            if (index > -1) {
                this.allSelectedRows.splice(index, 1); 
            }
        }
    }
}
}