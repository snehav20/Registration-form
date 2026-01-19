using db from '../db/schema';
 
 service My{
    
     @odata.draft.enabled
entity Parents as projection on db.Parents;
entity Students as projection on db.Students;
entity Fees as projection on db.Fees;
 }