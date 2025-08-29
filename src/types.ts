export type StatKey =
  | 'K'
  | 'HB'
  | 'M'
  | 'T'
  | 'G'
  | 'B'
  | 'FF'
  | 'FA'
  | 'CL'
  | 'I50'
  | 'R50'
  | 'K_EF'
  | 'K_IF'
  | 'HB_EF'
  | 'HB_IF'
  | 'MC'
  | 'MUC'
  | 'CON'
  | 'UC'
  | 'GBG'
  | 'HO'

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
  ,
  {key:'K_EF',label:'Kick Effective',group:'offence'},
  {key:'K_IF',label:'Kick Ineffective',group:'offence'},
  {key:'HB_EF',label:'Handball Effective',group:'offence'},
  {key:'HB_IF',label:'Handball Ineffective',group:'offence'},
  {key:'MC',label:'Mark Contested',group:'general'},
  {key:'MUC',label:'Mark Uncontested',group:'general'},
  {key:'CON',label:'Contested',group:'general'},
  {key:'UC',label:'Uncontested',group:'general'},
  {key:'GBG',label:'Ground Ball Get',group:'general'},
  {key:'HO',label:'Hitout',group:'offence'}
]
