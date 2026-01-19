namespace db;
 
entity Parents {
  key ParentId        : String ;
  FatherName          : String(50) @mandatory;
  MotherName          : String(50) @mandatory;
  MobileNumber        : String(15)  @assert.format: '^[0-9]{10}$' @mandatory;
  Address             : String(150);
  ParentstoStudents   : Composition of many Students on ParentstoStudents.StudentstoParents=$self;
}
 
entity Students {
  key StudentId       : String ;
  key ParentId        : String ;
  FirstName           : String(50) @mandatory;
  LastName            : String(50);
  DateOfBirth         : Date @mandatory;
  Gender              : String(10);
  Grade               : String(10);
  StudentstoParents   : Association to one Parents on StudentstoParents.ParentId=ParentId;
  StudentstoFees      : Composition of many Fees on  StudentstoFees.FeestoStudents = $self;
}
 
entity Fees {
  key FeeId           :String;
  key StudentId       : String;
  FeeType             : String(30);  
  Amount              : Decimal(10,2);
  PaymentStatus       : String(15); 
  Receipts            : String;
  FeestoStudents      : Association to one Students on FeestoStudents.StudentId =StudentId ;
}