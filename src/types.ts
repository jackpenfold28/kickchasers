export type StatKey='K'|'HB'|'M'|'T'|'G'|'B'|'FF'|'FA'|'CL'|'I50'|'R50'
export const STAT_DEFS:{key:StatKey;label:string;group:'offence'|'defence'|'score'|'general'}[]=[
  {key:'K',label:'Kick',group:'offence'},
  {key:'HB',label:'Handball',group:'offence'},
  {key:'M',label:'Mark',group:'general'},
  {key:'T',label:'Tackle',group:'defence'},
  {key:'G',label:'Goal',group:'score'},
  {key:'B',label:'Behind',group:'score'},
  {key:'FF',label:'Free For',group:'general'},
  {key:'FA',label:'Free Against',group:'general'},
  {key:'CL',label:'Clearance',group:'offence'},
  {key:'I50',label:'Inside 50',group:'offence'},
  {key:'R50',label:'Rebound 50',group:'defence'}
]
