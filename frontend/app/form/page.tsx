'use client';

/**
 * EFDA iLicense — Dynamic Application Form
 * Next.js (App Router) + Ant Design v5
 *
 * Install deps:  npm install antd @ant-design/icons
 * Usage:         Place in  app/application/page.jsx
 *                        or pages/application/index.jsx
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Form, Input, Select, Steps, Button, Card,
  InputNumber, Row, Col, Typography, message,
  Alert, Space, Divider, Tag, Spin, Result,
} from 'antd';
import {
  PlusOutlined, MinusCircleOutlined, SendOutlined,
  LeftOutlined, RightOutlined, UserOutlined,
  BankOutlined, ShopOutlined, EnvironmentOutlined,
  AuditOutlined, CheckCircleOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;

// ─────────────────────────────────────────────────────────
//  FULL SCHEMA
// ─────────────────────────────────────────────────────────
const SCHEMA = {
  submitUrl: 'https://ilicense.staging.api.efda.gov.et/api/Application',
  attachmentUrl: 'https://ilicense.staging.api.efda.gov.et/api/Attachment',
  method: 'POST',
  sections: ['Facility', 'Product', 'Location', 'Professionals', 'Checklist', 'Review'],
  fields: [
    // ── FACILITY ──────────────────────────────────────────
    { name:'facility.name',             label:'Facility Name',     type:'text',       section:'Facility',  required:true  },
    { name:'facility.ownerName',        label:'Owner Name',        type:'text',       section:'Facility',  required:true  },
    { name:'facility.ownerPhoneNumber', label:'Owner Phone',       type:'text',       section:'Facility',  required:true  },
    { name:'facility.tinNumber',        label:'TIN Number',        type:'text',       section:'Facility',  required:true  },
    {
      name:'facility.facilityTypeID', label:'Facility Type', type:'select', section:'Facility', required:true,
      options:[
        {value:2,label:'Exporter'},{value:1,label:'Importer'},{value:4,label:'Manufacturer'},
        {value:12,label:'Retailer'},{value:3,label:'Wholesaler'},
      ],
    },
    {
      name:'facility.organizationTypeID', label:'Organization Type', type:'select', section:'Facility', required:true,
      options:[
        {value:1,label:'Government'},{value:2,label:'PLC'},{value:5,label:'Private'},
        {value:3,label:'Share'},{value:4,label:'Others'},
      ],
    },

    // ── PRODUCT ───────────────────────────────────────────
    {
      name:'productTypeID', label:'Product Type', type:'select', section:'Product', required:true,
      options:[
        {value:10,label:'Medical Gas'},{value:9,label:'Barrier Face Mask'},{value:8,label:'Tobacco'},
        {value:6,label:'Small Scale Medicine'},{value:5,label:'Cosmetics'},
        {value:4,label:'Medicine and Medical devices'},{value:3,label:'Medical Device'},
        {value:2,label:'Medicine'},{value:1,label:'Food'},
      ],
    },
    {
      name:'facilitySpecificProducts', label:'Specific Products', type:'multiSelect', section:'Product', required:true,
      options:[
        {value:257,label:'Agricultural Products'},{value:228,label:'Agricultural Products(except Coffee and Tea)'},
        {value:219,label:'Alcohol Drinks'},{value:218,label:'Alcohol Free Drinks(Except Potable Water)'},
        {value:265,label:'Antiseptic and disinfectant'},{value:296,label:'Antiseptic and Disinfectant'},
        {value:210,label:'Bakery Products'},{value:276,label:'Barrier Face Mask'},
        {value:239,label:'Beverage Products'},{value:248,label:'Beverage Products'},{value:256,label:'Beverages'},
        {value:286,label:'Biologicals (Aseptically Prepared)'},{value:281,label:'Cephalosporins (Aseptically Prepared)'},
        {value:283,label:'Cephalosporins (Non-Sterile Products)'},{value:282,label:'Cephalosporins (Terminally Sterilized)'},
        {value:251,label:'Chemicals Used for Medical, Manufacture of Food and Medicine including Precursor Chemicals'},
        {value:272,label:'Chemicals used for Other Medical Manufacture, Food and Medicine including Precursor Chemicals'},
        {value:224,label:'Chemicals used for Other Medical Manufacture, Food and Medicine including Precursor Chemicals'},
        {value:242,label:'Cleaning and Cosmetics'},{value:252,label:'Cleaning and Cosmetics Equipments'},
        {value:225,label:'Cleaning, Cosmetics and Inputs'},{value:255,label:'Cleaning, Cosmetics and Inputs'},
        {value:267,label:'Clinical Chemistry reagent'},{value:229,label:'Coffee and Tea'},{value:216,label:'Coffee and Tea'},
        {value:212,label:'Confectionery Foods (including Biscuits, Cocoa, Chocolate, Candy and Chewing Gum)'},
        {value:261,label:'Cosmetics, Perfumery and Sanitary Articles'},{value:206,label:'Dairy and Dairy Products'},
        {value:205,label:'Edible Oil'},{value:209,label:'Fast Foods'},{value:231,label:'Food'},{value:260,label:'Food'},
        {value:247,label:'Food Products'},{value:238,label:'Food Products'},
        {value:278,label:'General (Aseptically Prepared)'},{value:280,label:'General Non-Sterile Products'},
        {value:279,label:'General (Terminally Sterilized)'},{value:207,label:'Grinding/Manufacturing of Grains'},
        {value:268,label:'Hematology reagent'},{value:271,label:'Histopathology reagent'},
        {value:258,label:'Honey and Bee Wax'},{value:215,label:'Honey and Honey Products'},
        {value:269,label:'Hospital furniture'},{value:253,label:'Human Medical Supplies and Equipments'},
        {value:245,label:'Human Medicine, Medical Supplies and Equipments'},{value:244,label:'Human Medicine, Medical Supplies and Equipments'},
        {value:243,label:'Human Medicine, Medical Supplies and Equipments'},{value:297,label:'Laboratory Reagent'},
        {value:237,label:'Live Animal Products(for consumption)'},{value:246,label:'Live Animal Products(for consumption)'},
        {value:227,label:'Livestock Products'},{value:263,label:'Medical Equipments and Pharamceutical'},
        {value:277,label:'Medical Gas'},{value:226,label:'Medical Instruments and Appliances'},
        {value:274,label:'Medicines and Medical Equipments and Accessories'},
        {value:235,label:'Medicines, and Medical Equipments and Accessories'},
        {value:233,label:'Medicines, and Medical Equipments and Accessories'},
        {value:287,label:'Oncology (Aseptically Prepared)'},{value:289,label:'Oncology (Non-Sterile Products)'},
        {value:288,label:'Oncology (Terminally Sterilized)'},
        {value:214,label:'Pasta, Macaroni, Noodles, Couscous and Similar Products'},
        {value:285,label:'Penicillin (Non-Sterile Products)'},{value:284,label:'Penicillins Aseptically Prepared'},
        {value:298,label:'Pharmaceutical Raw materials and inputs'},
        {value:221,label:'Pharmaceuticals and Medicinal Chemicals for Human Use'},
        {value:275,label:'Pharmaceuticals and Medicinal Chemicals for Human Use'},
        {value:217,label:'Potable Water'},{value:240,label:'Processed Agricultural Products'},
        {value:250,label:'Processed Agricultural Products(except Coffee and Coffee Leaves)'},
        {value:241,label:'Processed Coffee'},{value:204,label:'Processing and preserving of fruit and vegetables'},
        {value:203,label:'Processing and preserving of sea food animals and their products'},
        {value:202,label:'Producing, processing and preserving of meat and meat products'},
        {value:293,label:'Radionuclide (Aseptically Prepared)'},{value:295,label:'Radionuclide (Non-Sterile Products)'},
        {value:294,label:'Radionuclide Terminally Sterilized'},{value:213,label:'Salt Production'},
        {value:259,label:'Sea Food Animals'},{value:273,label:'Small Scale Medical Device'},
        {value:266,label:'Staining laboratory reagent'},{value:208,label:'Starches, Starch and Condiments Products'},
        {value:290,label:'Steroids (Aseptically Prepared)'},{value:292,label:'Steroids (Non-Sterile Products)'},
        {value:291,label:'Steroids Terminally Sterilized'},{value:211,label:'Sugar'},{value:270,label:'Supplies'},
        {value:230,label:'Tobacco and Tobacco Products'},{value:220,label:'Tobacco Products'},
        {value:249,label:'Tobacco Products'},{value:262,label:'Tobacco Products'},
      ],
    },
    {
      name:'facilitySpecificProductItems', label:'Specific Product Items', type:'multiSelect', section:'Product', required:true,
      options:[],
    },

    // ── LOCATION ──────────────────────────────────────────
    {
      name:'location.regionID', label:'Region', type:'select', section:'Location', required:true,
      options:[
        {value:1,label:'Addis Ababa'},{value:2,label:'Affar'},{value:3,label:'Amhara'},
        {value:4,label:'Benishangul-Gumuz'},{value:5,label:'Dire Dawa'},{value:6,label:'Gambella'},
        {value:7,label:'Harari'},{value:8,label:'Oromia'},{value:12,label:'Sidama'},
        {value:9,label:'SNNP'},{value:11,label:'Somali'},{value:10,label:'Tigray'},
      ],
    },
    {
      name:'location.zoneID', label:'Zone', type:'dependent', section:'Location', required:true,
      dependsOn:'location.regionID',
      dependentOptions:{
        '1':[{value:1,label:'Addis Ketema Sub City'},{value:2,label:'Akaki Kaliti Sub City'},{value:3,label:'Arada Sub City'},{value:4,label:'Bole Sub City'},{value:5,label:'Gulele Sub City'},{value:6,label:'Kirkos Sub City'},{value:7,label:'Kolfe Keraniyo Sub City'},{value:143,label:'Lemi Kura'},{value:8,label:'Lideta Sub City'},{value:9,label:'Nefas Silk-Lafto Sub City'},{value:10,label:'Yeka Sub City'}],
        '2':[{value:12,label:'Afdem'},{value:11,label:'Zone 1'},{value:111,label:'Zone 2'},{value:13,label:'Zone 3'},{value:14,label:'Zone 4'},{value:15,label:'Zone 5'}],
        '3':[{value:16,label:'Argoba Special Woreda'},{value:17,label:'Awi'},{value:18,label:'Bahir Dar City Administration'},{value:123,label:'Central Gondar'},{value:110,label:'Dessie Town'},{value:19,label:'East Gojjam'},{value:119,label:'Gondar Special Zone'},{value:137,label:'Kamash'},{value:136,label:'Metekel'},{value:20,label:'North Gondar'},{value:21,label:'North Shewa'},{value:22,label:'North Wello'},{value:23,label:'Oromia'},{value:109,label:'Oromia Special Zone'},{value:24,label:'South Gondar'},{value:25,label:'South Wello'},{value:26,label:'Waghemira'},{value:27,label:'West Gojjam'},{value:134,label:'West Gondar'}],
        '4':[{value:28,label:'Asossa'},{value:29,label:'Kemashi Zone'},{value:30,label:'Mao Komo Special Wereda'},{value:31,label:'Mao Komo Special Zone'},{value:32,label:'Metekel'},{value:33,label:'Pawe Special Wereda'},{value:34,label:'Pawe Special Zone'}],
        '5':[{value:35,label:'Dire Dawa'}],
        '6':[{value:36,label:'Agnewak'},{value:37,label:'Etang Special'},{value:125,label:'Gambella Special Zone'},{value:112,label:'Itang'},{value:104,label:'Majang'},{value:38,label:'Mezhenger'},{value:39,label:'Nuwer'}],
        '7':[{value:40,label:'Harari All Wereda'}],
        '8':[{value:41,label:'Adama Special Zone'},{value:101,label:'Addis Ababa'},{value:42,label:'Arsi'},{value:130,label:'Assela Town'},{value:43,label:'Bale'},{value:127,label:'Batu Town'},{value:128,label:'Bishoftu Town'},{value:44,label:'Borena'},{value:126,label:'Buno Bedelle'},{value:45,label:'Burayu Special Zone'},{value:46,label:'East Shewa'},{value:47,label:'East Wellega'},{value:48,label:'Guji'},{value:49,label:'Horo Gudru Welega'},{value:50,label:'Illu Aba Bora'},{value:51,label:'Jima Special Zone'},{value:52,label:'Jimma'},{value:53,label:'Kelem Welega'},{value:54,label:'North Shewa SAME 8'},{value:55,label:'South West Shewa'},{value:56,label:'West Arsi'},{value:121,label:'West Guji'},{value:57,label:'West Hararge'},{value:58,label:'West Shewa'},{value:59,label:'West Wellega'}],
        '9':[{value:60,label:'Alaba'},{value:138,label:'Ale Special Wereda'},{value:61,label:'Amaro Special Wereda'},{value:62,label:'Basketo Special Wereda'},{value:63,label:'Bench Maji'},{value:64,label:'Burji Special Wereda'},{value:139,label:'Darashe Special Wereda'},{value:65,label:'Dawro'},{value:140,label:'Gamo'},{value:68,label:'Gedeo'},{value:141,label:'Gofa'},{value:69,label:'Gurage'},{value:70,label:'Hadiya'},{value:72,label:'Keffa'},{value:73,label:'Kembata Tembaro'},{value:74,label:'Konso'},{value:75,label:'Konta Special Wereda'},{value:76,label:'Sheka'},{value:78,label:'Silti'},{value:79,label:'South Omo'},{value:142,label:'West Omo'},{value:80,label:'Wolayita'},{value:81,label:'Yem Special Wereda'}],
        '10':[{value:82,label:'Central Tigray'},{value:83,label:'Eastern Tigray'},{value:84,label:'Mekele Special'},{value:85,label:'North Western Tigray'},{value:98,label:'South Eastern'},{value:86,label:'Southern Tigray'},{value:87,label:'Western Tigray'}],
        '11':[{value:96,label:'Afdere'},{value:99,label:'Awbere'},{value:108,label:'City'},{value:94,label:'Degehabur'},{value:122,label:'Dhaawe'},{value:115,label:'Dollo'},{value:91,label:'Erer'},{value:106,label:'Fafan'},{value:107,label:'Fik'},{value:92,label:'Gode'},{value:116,label:'Jarar'},{value:89,label:'Jijiga'},{value:90,label:'Kebridahre'},{value:114,label:'Korahe'},{value:95,label:'Liben'},{value:117,label:'Nogob'},{value:113,label:'Shabele'},{value:97,label:'Shinile'},{value:118,label:'Siti'},{value:93,label:'Warder'}],
        '12':[{value:77,label:'Sidama'}],
      },
    },
    {
      name:'location.woredaID', label:'Woreda', type:'dependent', section:'Location', required:true,
      dependsOn:'location.zoneID',
      dependentOptions:{
        '1':[{value:1,label:'01'},{value:2,label:'02'},{value:3,label:'03'},{value:4,label:'04'},{value:5,label:'05'},{value:6,label:'06'},{value:7,label:'07'},{value:8,label:'08'},{value:9,label:'09'},{value:10,label:'10'}],
        '2':[{value:11,label:'01'},{value:12,label:'02'},{value:13,label:'03'},{value:14,label:'04'},{value:15,label:'05'},{value:16,label:'06'},{value:17,label:'07'},{value:18,label:'08'},{value:19,label:'09'},{value:20,label:'10'},{value:21,label:'11'}],
        '3':[{value:22,label:'01'},{value:23,label:'02'},{value:24,label:'03'},{value:25,label:'04'},{value:26,label:'05'},{value:27,label:'06'},{value:28,label:'07'},{value:29,label:'08'},{value:30,label:'09'},{value:31,label:'10'}],
        '4':[{value:32,label:'01'},{value:33,label:'02'},{value:34,label:'03'},{value:35,label:'04'},{value:36,label:'05'},{value:37,label:'06'},{value:38,label:'07'},{value:39,label:'08'},{value:40,label:'09'},{value:41,label:'10'},{value:42,label:'11'},{value:43,label:'12'},{value:44,label:'13'},{value:45,label:'14'}],
        '5':[{value:46,label:'01'},{value:47,label:'02'},{value:48,label:'03'},{value:49,label:'04'},{value:50,label:'05'},{value:51,label:'06'},{value:52,label:'07'},{value:53,label:'08'},{value:54,label:'09'},{value:55,label:'10'}],
        '6':[{value:56,label:'01'},{value:57,label:'02'},{value:58,label:'03'},{value:59,label:'04'},{value:60,label:'05'},{value:61,label:'06'},{value:62,label:'07'},{value:63,label:'08'},{value:64,label:'09'},{value:65,label:'10'},{value:66,label:'11'}],
        '7':[{value:67,label:'01'},{value:68,label:'02'},{value:69,label:'03'},{value:70,label:'04'},{value:71,label:'05'},{value:72,label:'06'},{value:73,label:'07'},{value:74,label:'08'},{value:75,label:'09'},{value:76,label:'10'},{value:77,label:'11'},{value:78,label:'12'},{value:79,label:'13'},{value:80,label:'14'},{value:81,label:'15'}],
        '8':[{value:82,label:'01'},{value:83,label:'02'},{value:84,label:'03'},{value:85,label:'04'},{value:86,label:'05'},{value:87,label:'06'},{value:88,label:'07'},{value:89,label:'08'},{value:90,label:'09'},{value:91,label:'10'}],
        '9':[{value:92,label:'01'},{value:93,label:'02'},{value:94,label:'03'},{value:95,label:'04'},{value:96,label:'05'},{value:97,label:'06'},{value:98,label:'07'},{value:99,label:'08'},{value:100,label:'09'},{value:101,label:'10'},{value:102,label:'11'},{value:103,label:'12'}],
        '10':[{value:104,label:'01'},{value:105,label:'02'},{value:106,label:'03'},{value:107,label:'04'},{value:108,label:'05'},{value:109,label:'06'},{value:110,label:'07'},{value:111,label:'08'},{value:112,label:'09'},{value:113,label:'10'},{value:114,label:'11'},{value:115,label:'12'},{value:116,label:'13'}],
        '11':[{value:968,label:'Adaar'},{value:117,label:'Afambo'},{value:118,label:'Asayita'},{value:119,label:'Chifra'},{value:120,label:'Dubti'},{value:121,label:'Elidar'},{value:122,label:'Kori'},{value:124,label:'Logiya'},{value:123,label:'Mile'}],
        '12':[{value:133,label:'Amibara'},{value:134,label:'Argoba Liyu'},{value:135,label:'Awash Fentale'},{value:136,label:'Bure Mudayitu'},{value:137,label:'Dulacha'},{value:138,label:'Gewane'}],
        '13':[{value:139,label:'Awra'},{value:140,label:'Ewa'},{value:141,label:'Golina'},{value:142,label:'Teru'},{value:143,label:'Yalo'}],
        '14':[{value:144,label:'Dalifage'},{value:145,label:'Dawe'},{value:146,label:'Hadele Ele'},{value:147,label:'Sumu Robi'},{value:148,label:'Telalak'}],
        '16':[{value:149,label:'Argoba Special Woreda'}],
        '17':[{value:150,label:'Ankasha Guagusa'},{value:159,label:'Banja'},{value:151,label:'Banja Shekudad'},{value:157,label:'Chaggni Town'},{value:152,label:'Dangila Town'},{value:153,label:'Fagita Lekoma'},{value:154,label:'Guagusa Shikudad'},{value:155,label:'Guangua'},{value:158,label:'Injibara'},{value:156,label:'Jawi'},{value:160,label:'Zigem Woreda'}],
        '18':[{value:161,label:'Bahir Dar Ketema Woreda'}],
        '19':[{value:162,label:'Aneded'},{value:163,label:'Awabel Wereda'},{value:164,label:'Baso Liben'},{value:165,label:'Bibugn'},{value:166,label:'Debay Tilatgen'},{value:167,label:'Debre Elias'},{value:168,label:'Debre Markos/Town'},{value:169,label:'Dejen'},{value:170,label:'Enarj Enawga'},{value:171,label:'Enebse Sar Midir'},{value:172,label:'Enemay'},{value:173,label:'Goncha Siso Enesie Wereda'},{value:174,label:'Gozamin'},{value:175,label:'Hulet Ej Enese'},{value:176,label:'Machakel'},{value:179,label:'Motta Ketema'},{value:177,label:'Shebel Berenta'},{value:178,label:'Sinan'}],
        '20':[{value:184,label:'Adiarkay'},{value:186,label:'Beyeda'},{value:188,label:'Dabat'},{value:189,label:'Debark Zuria'},{value:190,label:'Dembia'},{value:192,label:'Gonder/Town'},{value:193,label:'Janamora'},{value:195,label:'Merab Armachoho'},{value:198,label:'Misrak Belesa'},{value:203,label:'Tselemet'}],
        '21':[{value:205,label:'Angolala Tera'},{value:206,label:'Ankober'},{value:207,label:'Antsokiya Gemza'},{value:208,label:'Asagirt'},{value:209,label:'Basona Werana'},{value:210,label:'Berehet'},{value:211,label:'Debre Berhan/Town'},{value:212,label:'Efrata Gidim'},{value:213,label:'Ensaro'},{value:214,label:'Gishe'},{value:215,label:'Hagere Mariam Kesem'},{value:216,label:'Kewet'},{value:217,label:'Menz Gera Midir'},{value:218,label:'Menz Keya Gebreal'},{value:219,label:'Menz Lalo Midir'},{value:220,label:'Menz Mama Midir'},{value:221,label:'Merhabete'},{value:222,label:'Mida Woremo'},{value:223,label:'Minjar Shenkora'},{value:224,label:'Mojana Waderea'},{value:225,label:'Moretna Jiru'},{value:226,label:'Saya Debirna Wayu'},{value:227,label:'Tarma Ber'}],
        '22':[{value:248,label:'Bugna'},{value:249,label:'Dawunt'},{value:250,label:'Delanta'},{value:251,label:'Gidan'},{value:252,label:'Gubalafto'},{value:253,label:'Habru'},{value:254,label:'Kobo'},{value:255,label:'Lasta'},{value:256,label:'Meket'},{value:257,label:'Wadla'},{value:258,label:'Woldiya/Town'}],
        '23':[{value:259,label:'Artuma Fursi'},{value:260,label:'Bati'},{value:261,label:'Chafe Gola'},{value:265,label:'Dawa Chefa'},{value:262,label:'Dawe Harewa'},{value:263,label:'Jile Timuga'},{value:264,label:'Kemisie/Town'}],
        '24':[{value:268,label:'Debre Tabor/Town'},{value:267,label:'Dera'},{value:269,label:'Ebinat'},{value:270,label:'Farta'},{value:271,label:'Fogera'},{value:272,label:'Lay Gayint'},{value:273,label:'Libokemkem'},{value:274,label:'Merab Este'},{value:275,label:'Misrak Este'},{value:276,label:'Simada'},{value:277,label:'Tach Gayint'},{value:266,label:'Woreta Town'}],
        '25':[{value:278,label:'Albuko'},{value:279,label:'Ambasel'},{value:280,label:'Debresina'},{value:282,label:'Dessie/Town'},{value:281,label:'Dessie Zuria'},{value:283,label:'Jama'},{value:284,label:'Kalu'},{value:285,label:'Kelela'},{value:286,label:'Kombolcha/Town'},{value:287,label:'Kutaber'},{value:288,label:'Legahida'},{value:289,label:'Legambo'},{value:290,label:'Mehal Saynt Wereda'},{value:291,label:'Mekdela'},{value:292,label:'Sayint'},{value:293,label:'Tehuledere'},{value:294,label:'Tenta'},{value:295,label:'Wegidi'},{value:296,label:'Were Ilu'}],
        '26':[{value:299,label:'Abergele'},{value:300,label:'Dehana'},{value:301,label:'Gazgibla'},{value:302,label:'Sehala'},{value:303,label:'Sekota'},{value:304,label:'Ziquala'}],
        '27':[{value:321,label:'Adet Town'},{value:305,label:'Bahri Dar Zuria'},{value:319,label:'Bure Town'},{value:306,label:'Debub Achefer'},{value:307,label:'Dega Damot'},{value:308,label:'Dembecha'},{value:309,label:'Finote Selam/Town'},{value:311,label:'Jabi Tehnan'},{value:312,label:'Mecha'},{value:320,label:'Merawi Town'},{value:313,label:'Quarit'},{value:314,label:'Sekela'},{value:315,label:'Semen Achefer'},{value:316,label:'Wonberma'},{value:317,label:'Yilma Na Densa'}],
        '28':[{value:324,label:'Asossa'},{value:325,label:'Bambasi'},{value:326,label:'Homesha'},{value:327,label:'Kurmuk'},{value:328,label:'Menge'},{value:329,label:'Odabuldi-Guli'},{value:330,label:'Sherkole'}],
        '35':[{value:348,label:'Dire Dawa'}],
        '36':[{value:349,label:'Abobo'},{value:350,label:'Dima'},{value:351,label:'Gambella /Town'},{value:352,label:'Gambella Zuria'},{value:353,label:'Gog'},{value:354,label:'Jor'}],
        '40':[{value:363,label:'Aboker'},{value:364,label:'Hakim'},{value:362,label:'Harari All Wereda'},{value:365,label:'Jinela'}],
        '41':[{value:366,label:'Adama Special Zone'}],
        '42':[{value:367,label:'Amigna'},{value:368,label:'Aseko'},{value:369,label:'Asela/Town'},{value:370,label:'Bale Gasegar'},{value:371,label:'Chole'},{value:372,label:'Deksis'},{value:373,label:'Digluna Tijo'},{value:374,label:'Dodota'},{value:375,label:'Enkelo Wabe'},{value:376,label:'Gololcha'},{value:377,label:'Guna'},{value:378,label:'Hitosa'},{value:379,label:'Jeju'},{value:380,label:'Limuna Bilbilo'},{value:381,label:'Lude Hitosa'},{value:382,label:'Merti'},{value:383,label:'Munesa'},{value:384,label:'Robe'},{value:385,label:'Seru'},{value:386,label:'Shirka'},{value:387,label:'Sire'},{value:388,label:'Sude'},{value:389,label:'Tena'},{value:390,label:'Tiyo'},{value:391,label:'Ziway Dugda'}],
        '43':[{value:394,label:'Agarfa'},{value:395,label:'Berbere'},{value:396,label:'Dawe Kachen'},{value:397,label:'Dawe Serer'},{value:398,label:'Dinsho'},{value:399,label:'Dolo Mena'},{value:400,label:'Gasera'},{value:401,label:'Ginir'},{value:403,label:'Goba/Town'},{value:402,label:'Goba Wereda'},{value:404,label:'Gololcha'},{value:405,label:'Guradamole'},{value:406,label:'Harena Buluk'},{value:408,label:'Meda Welabu'},{value:409,label:'Rayitu'},{value:410,label:'Robe/Town'},{value:411,label:'Seweyna'},{value:412,label:'Sinana Wereda'}],
        '44':[{value:413,label:'Abaya'},{value:414,label:'Arero'},{value:415,label:'Bule Hora'},{value:416,label:'Dire'},{value:417,label:'Dugida Dawa'},{value:418,label:'Gelana'},{value:419,label:'Miyu'},{value:420,label:'Teletele'},{value:421,label:'Yabelo'}],
        '45':[{value:427,label:'Burayu Special Zone'}],
        '46':[{value:428,label:'Ada A'},{value:429,label:'Adama'},{value:430,label:'Adami Tulu Jido Kombolcha'},{value:431,label:'Bishoftu/Town'},{value:432,label:'Bora'},{value:433,label:'Boset'},{value:434,label:'Dugda'},{value:435,label:'Fentale'},{value:436,label:'Gimbichu'},{value:437,label:'Lome'},{value:438,label:'Ziway/Town'}],
        '48':[{value:459,label:'Adola'},{value:460,label:'Adola/Town'},{value:461,label:'Bore'},{value:462,label:'Girja'},{value:463,label:'Hambela Wamena'},{value:464,label:'Kercha'},{value:465,label:'Negele/Town'},{value:466,label:'Odo Shakiso'},{value:467,label:'Uraga'},{value:468,label:'Wadera'}],
        '50':[{value:486,label:'Ale'},{value:487,label:'Alge Sachi'},{value:489,label:'Bedele/Town'},{value:488,label:'Bedele Zuria'},{value:490,label:'Bicho'},{value:491,label:'Bilo Nopha'},{value:492,label:'Borecha'},{value:493,label:'Chewaka'},{value:494,label:'Chora'},{value:495,label:'Dabo Hana'},{value:496,label:'Darimu'},{value:497,label:'Dedesa'},{value:498,label:'Dega'},{value:499,label:'Didu'},{value:500,label:'Doreni'},{value:501,label:'Gechi'},{value:502,label:'Huka/Halu'},{value:503,label:'Hurumu'},{value:504,label:'Mako'},{value:506,label:'Metu/Town'},{value:505,label:'Metu Zuria'},{value:507,label:'Nono Sele'},{value:508,label:'Yayu'}],
        '52':[{value:511,label:'Agaro/Town'},{value:512,label:'Chora Botor'},{value:513,label:'Dedo'},{value:514,label:'Gera'},{value:515,label:'Gomma'},{value:516,label:'Guma'},{value:528,label:'Jimma Town'},{value:517,label:'Kersa'},{value:518,label:'Limu Kosa'},{value:519,label:'Limu Seka'},{value:520,label:'Mana'},{value:521,label:'Omonada'},{value:522,label:'Seka Chekorsa'},{value:523,label:'Setema'},{value:524,label:'Shebe Senbo'},{value:525,label:'Sigamo'},{value:526,label:'Sokoru'},{value:527,label:'Tiro Afeta'}],
        '55':[{value:561,label:'Ameya'},{value:562,label:'Becho'},{value:563,label:'Dawo'},{value:564,label:'Ilu'},{value:565,label:'Kersa Ena Malima'},{value:566,label:'Sebeta Hawas'},{value:567,label:'Sebeta/Town'},{value:568,label:'Seden Sodo Wereda'},{value:569,label:'Sodo Dacha Wereda'},{value:570,label:'Tole'},{value:571,label:'Woliso'},{value:572,label:'Woliso/Town'},{value:573,label:'Wonchi'}],
        '56':[{value:574,label:'Adaba'},{value:575,label:'Arsi Negele'},{value:576,label:'Dodola'},{value:577,label:'Gedeb Asasa'},{value:578,label:'Kofele'},{value:579,label:'Kokosa'},{value:580,label:'Kore Wereda'},{value:581,label:'Nensebo'},{value:582,label:'Shala'},{value:584,label:'Shashemene/Town'},{value:583,label:'Shashemene Zuria'},{value:585,label:'Siraro'}],
        '58':[{value:620,label:'Abuna Gindeberet'},{value:621,label:'Ada Berga'},{value:623,label:'Ambo/Town'},{value:622,label:'Ambo Zuria'},{value:624,label:'Bako Tibe'},{value:625,label:'Cheliya'},{value:626,label:'Dano'},{value:627,label:'Dendi'},{value:628,label:'Ejere'},{value:629,label:'Elfata'},{value:630,label:'Ginde Beret'},{value:631,label:'Holeta Town'},{value:632,label:'Jeldu'},{value:633,label:'Jibat'},{value:634,label:'Meta Robi'},{value:635,label:'Midakegn'},{value:636,label:'Nono'},{value:637,label:'Tikur Enchini'},{value:638,label:'Toke Kutayu'},{value:639,label:'Wolmera'}],
        '59':[{value:640,label:'Ayira'},{value:641,label:'Babo Gambel'},{value:642,label:'Begi'},{value:643,label:'Boji Chekorsa'},{value:644,label:'Boji Dirmeji'},{value:645,label:'Genji'},{value:646,label:'Gimbi'},{value:647,label:'Gimbi/Town'},{value:648,label:'Guliso'},{value:649,label:'Haru'},{value:650,label:'Homa'},{value:651,label:'Kiltu Kara'},{value:652,label:'Kondala'},{value:653,label:'Lalo Asabi'},{value:654,label:'Menesibu'},{value:655,label:'Nejo'},{value:656,label:'Nole Kaba'},{value:657,label:'Seyo Nole'},{value:658,label:'Yubdo'}],
        '69':[{value:711,label:'Abeshge'},{value:712,label:'Butajira/Town'},{value:713,label:'Cheha'},{value:710,label:'Endegagn'},{value:714,label:'Enemorna Ener'},{value:715,label:'Ezha'},{value:716,label:'Geta'},{value:717,label:'Gumer'},{value:718,label:'Kebena'},{value:719,label:'Kokir Gedabano'},{value:720,label:'Mareko'},{value:721,label:'Mesekan'},{value:722,label:'Muhor Na Aklil'},{value:723,label:'Sodo'},{value:724,label:'Welkite/Town'}],
        '70':[{value:726,label:'Analimo'},{value:727,label:'Duna'},{value:728,label:'Gibe'},{value:729,label:'Gomibora'},{value:730,label:'Hosaena/Town'},{value:731,label:'Lemo'},{value:732,label:'Merab Badwacho'},{value:733,label:'Misha'},{value:734,label:'Misrak Badawacho'},{value:735,label:'Shashago'},{value:736,label:'Soro'}],
        '72':[{value:738,label:'Bita'},{value:739,label:'Bonga/Town'},{value:740,label:'Chena'},{value:741,label:'Cheta'},{value:742,label:'Decha'},{value:743,label:'Gesha Deka'},{value:744,label:'Gewata'},{value:745,label:'Gimbo'},{value:746,label:'Menjiwo'},{value:747,label:'Sayilem'},{value:748,label:'Teloada'}],
        '73':[{value:749,label:'Angacha'},{value:750,label:'Deniboya'},{value:751,label:'Doyo Gena'},{value:752,label:'Durame/Town'},{value:753,label:'Hadero Tunito'},{value:754,label:'Kacha Bira'},{value:755,label:'Kedida Gamela'},{value:756,label:'Tembaro'}],
        '77':[{value:762,label:'Aleta Wendo'},{value:763,label:'Arbegona'},{value:764,label:'Aroresa'},{value:765,label:'Bensa'},{value:766,label:'Bona Zuria'},{value:767,label:'Boricha'},{value:768,label:'Bursa'},{value:769,label:'Cheko'},{value:770,label:'Chere'},{value:780,label:'Dale'},{value:771,label:'Dara'},{value:772,label:'Gorche'},{value:773,label:'Hawassa Zuria'},{value:774,label:'Hula'},{value:775,label:'Loko Abeya'},{value:776,label:'Malga'},{value:777,label:'Shebedino'},{value:778,label:'Wendo Genet'},{value:779,label:'Wensho'}],
        '78':[{value:783,label:'Alicho Werero'},{value:784,label:'Dalocha'},{value:782,label:'Hulbareg'},{value:785,label:'Lanfuro'},{value:781,label:'Mehal Azerinet'},{value:786,label:'Merab Azernet'},{value:787,label:'Misrak Azernet'},{value:788,label:'Sankura'},{value:789,label:'Silti'},{value:790,label:'Wulbareg'}],
        '80':[{value:800,label:'Boloso Bonibe'},{value:801,label:'Boloso Sore'},{value:802,label:'Damot Gale'},{value:803,label:'Damot Pulasa'},{value:804,label:'Damot Sore'},{value:805,label:'Damot Woyide'},{value:806,label:'Deguna Fanigo'},{value:807,label:'Humbo'},{value:808,label:'Kindo Didaye'},{value:809,label:'Kindo Koyisha'},{value:810,label:'Ofa'},{value:812,label:'Sodo/Town'},{value:811,label:'Sodo Zuria'}],
        '82':[{value:814,label:'Abi Adi/Town'},{value:815,label:'Adwa'},{value:816,label:'Adwa/Town'},{value:817,label:'Ahiferom'},{value:818,label:'Axum/Town'},{value:819,label:'Dega Temben'},{value:820,label:'Kola Temben'},{value:821,label:'Laelay Maychew'},{value:822,label:'Mereb Lehe'},{value:823,label:'Nader Adet'},{value:824,label:'Tahtay Maychew'},{value:825,label:'Tanqua Abergele'},{value:826,label:'Were Lehe'}],
        '83':[{value:827,label:'Adigrat/Town'},{value:828,label:'Atsbi Wonberta'},{value:829,label:'Erob'},{value:830,label:'Ganta Afeshum'},{value:831,label:'Gulo Meheda'},{value:832,label:'Hawuzen'},{value:833,label:'Kilte Awlalo'},{value:834,label:'Saesi Tsadamba'},{value:835,label:'Wukro/Town'}],
        '84':[{value:836,label:'Debub'},{value:837,label:'Semen'}],
        '85':[{value:838,label:'Asegede Tsimbila'},{value:839,label:'Laelay Adiyabo'},{value:840,label:'Medebay Zana'},{value:841,label:'Shere Endasilasie/Town'},{value:842,label:'Shiraro/Town'},{value:843,label:'Tahtay Adiyabo'},{value:844,label:'Tahtay Koraro'},{value:845,label:'Tselemti'}],
        '86':[{value:847,label:'Alaje'},{value:848,label:'Alamata'},{value:849,label:'Alamata/Town'},{value:846,label:'Endamehoni'},{value:850,label:'Hintalo Wajirat'},{value:851,label:'Korem/Town'},{value:852,label:'Maychew/Town'},{value:853,label:'Ofla'},{value:854,label:'Raya Azebo'}],
        '87':[{value:857,label:'Humera/Town'},{value:858,label:'Kafta Humera'},{value:859,label:'Tsegede'},{value:860,label:'Welkayit'}],
        '89':[{value:895,label:'Areka Town Administration'},{value:896,label:'Jijiga'}],
        '106':[{value:1012,label:'Babile'},{value:1013,label:'Goljano'},{value:1014,label:'Gursum'},{value:1015,label:'Harshin'},{value:1016,label:'Jijiga'},{value:1017,label:'Jijiga City'},{value:1018,label:'Kabribayah'},{value:1019,label:'Tuliguled'}],
      },
    },
    {
      name:'location.cityID', label:'City', type:'select', section:'Location', required:true,
      options:[
        {value:2,label:'Addis Ababa'},{value:3,label:'Adama'},{value:4,label:'Bahir Dar'},{value:5,label:'Dese'},{value:6,label:'Mekele'},{value:7,label:'Jimma'},{value:8,label:'Bishoftu'},{value:9,label:'Kombolcha'},{value:10,label:'Harar'},{value:11,label:'Shashemene'},{value:12,label:'Arba Minch'},{value:13,label:'Adigrat'},{value:14,label:'Debre Markos'},{value:15,label:'Debre Birhan'},{value:16,label:'Jijiga'},{value:17,label:'Inda Silase'},{value:18,label:'Hawassa'},{value:19,label:'Dire Dawa'},{value:21,label:'Ambo town'},{value:22,label:'Sebeta'},{value:26,label:'Mojo'},{value:28,label:'Burayu'},{value:29,label:'legetafo'},{value:30,label:'Sululta'},{value:31,label:'Mekelle'},{value:32,label:'Dukem'},{value:33,label:'Semera'},{value:34,label:'Fitche'},{value:35,label:'Nekemte'},{value:37,label:'chaggni'},{value:38,label:'sendafa'},{value:41,label:'axum city'},{value:42,label:'Metu'},{value:45,label:'Metema'},{value:46,label:'Menagesha'},{value:47,label:'Adwa'},{value:49,label:'Dangila'},{value:50,label:'bati'},{value:51,label:'Midhega'},{value:52,label:'mizan aman'},{value:53,label:'fury'},{value:54,label:'Bonga'},{value:55,label:'SHERE ENDASLASE'},{value:57,label:'Meki'},{value:61,label:'Masha'},{value:62,label:'humera'},{value:63,label:'Indaslase Shire'},{value:65,label:'Adet'},{value:66,label:'nekemte town'},{value:67,label:'chiro'},{value:71,label:'Ebinat'},{value:72,label:'Endustry zone'},{value:74,label:'Dembecha'},{value:75,label:'Miesso'},{value:76,label:'Gelan'},{value:77,label:'Agaro'},{value:78,label:'gimbi'},{value:79,label:'Holeta'},{value:82,label:'Bure'},{value:83,label:'Bure'},{value:86,label:'Manksh'},{value:87,label:'Bedele'},{value:88,label:'Merawi'},{value:89,label:'Nefas Mewucha'},{value:93,label:'Motta'},{value:94,label:'Shinde'},{value:95,label:'emdibir'},{value:96,label:'worabe'},{value:97,label:'negele'},{value:99,label:'Batu'},{value:100,label:'Batu'},{value:102,label:'Hosaena'},{value:103,label:'wolaita sodo'},{value:104,label:'Durame'},{value:105,label:'bule hora'},{value:106,label:'cheha'},{value:107,label:'yirgachefe'},{value:108,label:'Butajira'},{value:109,label:'sodo'},{value:110,label:'sodo'},{value:111,label:'Gelgel Belese'},{value:112,label:'moyale'},{value:113,label:'melka soda'},{value:114,label:'weliso'},{value:116,label:'Yabelo'},{value:117,label:'KONSO, KARAT'},{value:118,label:'Agena'},{value:119,label:'bekoji'},{value:120,label:'Addis Zemen'},{value:121,label:'dilla town'},{value:122,label:'bale robe'},{value:124,label:'Bore'},{value:125,label:'Gambella'},{value:126,label:'Gambela'},{value:127,label:'Yirgalem'},{value:128,label:'Woreta'},{value:130,label:'wolete'},{value:131,label:'Negelle Borena'},{value:134,label:'shakiso'},{value:135,label:'Azezo'},{value:136,label:'SAGURE'},{value:137,label:'Gode'},{value:138,label:'Sawla'},{value:139,label:'Chuahit'},{value:140,label:'assosa town'},{value:141,label:'shineele'},{value:142,label:'buee'},{value:143,label:'ginir'},{value:144,label:'Kilto Gomoro'},{value:145,label:'Fedis'},{value:149,label:'dugda dawa'},{value:150,label:'Tulofa'},{value:151,label:'awash 7 killo'},{value:153,label:'Boditi'},{value:156,label:'Buii'},{value:158,label:'Hargele'},{value:163,label:'asebot'},{value:164,label:'Legetafo Legedadi'},{value:165,label:'bishan guracha'},{value:166,label:'Asasa'},{value:167,label:'Alaba Kulito'},{value:168,label:'Aweday'},{value:1,label:'Gondar'},{value:20,label:'Other'},
      ],
    },
    { name:'location.houseNo',  label:'House Number', type:'text', section:'Location', required:true  },
    { name:'location.areaName', label:'Area Name',    type:'text', section:'Location', required:true  },
    { name:'location.phoneNo',  label:'Phone Number', type:'text', section:'Location', required:true  },
    { name:'location.kebele',   label:'Kebele',       type:'text', section:'Location', required:false },

    // ── PROFESSIONALS (group) ─────────────────────────────
    {
      name:'professionals', label:'Professionals', type:'group', section:'Professionals', required:true,
      fields:[
        { name:'name',               label:'Name',               type:'text',   required:true  },
        { name:'phone',              label:'Phone',              type:'text',   required:true  },
        {
          name:'professionalTypeID', label:'Professional Type', type:'select', required:true,
          options:[
            {value:9,label:'Warehouse Manager'},{value:8,label:'Quality Control'},
            {value:6,label:'Physico-chemical Expert'},{value:7,label:'Microbiologist'},
            {value:5,label:'Hygiene and Sanitation Expert'},{value:3,label:'Quality Assurance'},
            {value:4,label:'Store Manager'},{value:2,label:'Production Manager'},
            {value:1,label:'Technical Leader'},
          ],
        },
        {
          name:'educationLevelID', label:'Education Level', type:'select', required:true,
          options:[
            {value:4,label:'10th Grade Complete'},{value:5,label:'12th Diploma'},
            {value:6,label:'TVET'},{value:7,label:'Diploma'},{value:1,label:'Degree'},
            {value:2,label:'Masters'},{value:3,label:'PHD'},
          ],
        },
        {
          name:'qualificationID', label:'Qualification', type:'select', required:true,
          options:[
            {value:102,label:'Accounting'},{value:15,label:'Applied Biology'},{value:14,label:'Applied Chemistry'},
            {value:147,label:'Applied Human Nutrition'},{value:60,label:'Banking And Finance'},
            {value:13,label:'Biochemistry'},{value:141,label:'Biology'},{value:12,label:'Biomedical Engineer'},
            {value:6,label:'Biomedical Equipment Maintenance Engineer'},{value:66,label:'Chemical Engineer'},
            {value:11,label:'Chemistry'},{value:41,label:'Computer Science'},{value:51,label:'Dairy Technology'},
            {value:4,label:'Dental Science Professional'},{value:10,label:'Druggist'},
            {value:46,label:'Economics'},{value:9,label:'Environmental Health'},{value:16,label:'Environmental Science'},
            {value:54,label:'Food Biotechnology and Fermentation Technology'},{value:17,label:'Food Engineering'},
            {value:55,label:'Food Microbiology'},{value:26,label:'Food Process Engineering'},
            {value:92,label:'Food Processing'},{value:53,label:'Food Safety and Quality'},
            {value:28,label:'Food Science and Nutrition'},{value:19,label:'Food Science and Post Harvest Technology'},
            {value:7,label:'Food Science and Technology'},{value:50,label:'Food Technology'},
            {value:48,label:'General Agriculture'},{value:137,label:'General Medical Practitioner'},
            {value:142,label:'Health Officer'},{value:149,label:'Human Nutrition'},
            {value:100,label:'Industrial Engineer'},{value:43,label:'Information Systems'},
            {value:27,label:'Lab Technician'},{value:44,label:'Management'},{value:38,label:'Marketing'},
            {value:110,label:'Meat Technology'},{value:79,label:'Mechanical Engineer'},
            {value:143,label:'Medical Doctor'},{value:5,label:'Medical Laboratory Technologist'},
            {value:25,label:'Microbiologist'},{value:138,label:'Midwifery'},{value:24,label:'Nurse'},
            {value:145,label:'Occupational Health'},{value:3,label:'Ophthalmologist'},
            {value:96,label:'Optometrist'},{value:23,label:'Pathology'},{value:22,label:'Pharmacist'},
            {value:21,label:'Physicochemical'},{value:146,label:'Physiotherapist'},
            {value:30,label:'Public Health'},{value:2,label:'Radiography Technologist'},
            {value:8,label:'Radiology'},{value:18,label:'Sanitary Science'},
            {value:83,label:'Sociologist'},{value:52,label:'Veterinary Microbiology'},{value:1,label:'Other'},
          ],
        },
        { name:'experience', label:'Experience (Years)', type:'number', required:true },
      ],
    },

    // ── REVIEW ────────────────────────────────────────────
    {
      name:'applicationStatusID', label:'Application Status', type:'select', section:'Review', required:true,
      options:[
        {value:1,label:'Requested'},{value:2,label:'Prescreened'},{value:3,label:'Prescreening Failed'},
        {value:4,label:'Verified'},{value:5,label:'Verification Failed'},{value:6,label:'Fee Attached'},
        {value:7,label:'Payment Verified'},{value:8,label:'Payment Verification Failed'},
        {value:9,label:'Inspection Passed'},{value:10,label:'Inspection Failed'},{value:11,label:'Approved'},
        {value:12,label:'Rejected'},{value:13,label:'Withdrawn'},{value:14,label:'Certificate Generated'},
        {value:34,label:'Pending'},{value:47,label:'Payment Pending'},{value:48,label:'Payment Confirmed'},
      ],
    },
    {
      name:'branchOfficeID', label:'Branch Office', type:'select', section:'Review', required:true,
      options:[
        {value:6,label:'East Ethiopia Branch Office'},{value:7,label:'EFDA'},
        {value:3,label:'North Eastern Ethiopia Branch Office'},{value:1,label:'North Ethiopia Branch Office'},
        {value:2,label:'North Western Ethiopia Branch Office'},{value:4,label:'South Ethiopia Branch Office'},
        {value:5,label:'South Western Ethiopia Branch Office'},
      ],
    },
    { name:'createdBy', label:'Created By (User ID)', type:'number', section:'Review', required:true },

    // ── CHECKLIST ─────────────────────────────────────────
    { name:'checkListInstances', label:'Checklist', type:'checklist', section:'Checklist', required:false },
  ],
};

// ─────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────
const getFieldsBySection = (section) =>
  SCHEMA.fields.filter((f) => f.section === section && f.type !== 'group' && f.type !== 'checklist');

/** Convert { 'a.b.c': v } → { a: { b: { c: v } } } */
const flatToNested = (flat = {}) => {
  const out = {};
  Object.entries(flat).forEach(([key, val]) => {
    const parts = key.split('.');
    let cur = out;
    parts.forEach((p, i) => {
      if (i === parts.length - 1) cur[p] = val;
      else { cur[p] = cur[p] ?? {}; cur = cur[p]; }
    });
  });
  return out;
};

const SECTION_ICONS = {
  Facility:      <BankOutlined />,
  Product:       <ShopOutlined />,
  Location:      <EnvironmentOutlined />,
  Professionals: <UserOutlined />,
  Checklist:     <CheckCircleOutlined />,
  Review:        <AuditOutlined />,
};

// ─────────────────────────────────────────────────────────
//  ATOMIC FIELD COMPONENTS
// ─────────────────────────────────────────────────────────
const FilterSelect = ({ field, disabled = false }) => (
  <Select
    placeholder={`Select ${field.label}`}
    showSearch
    optionFilterProp="children"
    filterOption={(inp, opt) => (opt?.children ?? '').toLowerCase().includes(inp.toLowerCase())}
    style={{ width: '100%' }}
    allowClear
    disabled={disabled}
  >
    {(field.options ?? []).map((o) => (
      <Option key={o.value} value={o.value}>{o.label}</Option>
    ))}
  </Select>
);

/** Dependent select — options driven by parent field value */
const DependentSelect = ({ field, form }) => {
  const parentValue = Form.useWatch(field.dependsOn, form);
  const prevRef = useRef(undefined);

  useEffect(() => {
    // Reset this field when parent changes
    if (prevRef.current !== parentValue) {
      form.setFieldValue(field.name, undefined);
      prevRef.current = parentValue;
    }
  }, [parentValue, field.name, form]);

  const opts = (field.dependentOptions ?? {})[String(parentValue)] ?? [];

  return (
    <Select
      placeholder={parentValue ? `Select ${field.label}` : `Select ${field.dependsOn.split('.').pop()} first`}
      showSearch
      optionFilterProp="children"
      filterOption={(inp, opt) => (opt?.children ?? '').toLowerCase().includes(inp.toLowerCase())}
      style={{ width: '100%' }}
      allowClear
      disabled={!parentValue || opts.length === 0}
    >
      {opts.map((o) => (
        <Option key={o.value} value={o.value}>{o.label}</Option>
      ))}
    </Select>
  );
};

/** Render the appropriate input for a field type */
const FieldControl = ({ field, form }) => {
  switch (field.type) {
    case 'text':
      return <Input placeholder={`Enter ${field.label}`} readOnly={field.readOnly} />;
    case 'number':
      return <InputNumber placeholder={`Enter ${field.label}`} style={{ width: '100%' }} min={0} />;
    case 'select':
      return <FilterSelect field={field} />;
    case 'multiSelect':
      return (
        <Select
          mode="multiple"
          placeholder={`Select ${field.label}`}
          showSearch
          optionFilterProp="children"
          filterOption={(inp, opt) => (opt?.children ?? '').toLowerCase().includes(inp.toLowerCase())}
          style={{ width: '100%' }}
          allowClear
        >
          {(field.options ?? []).map((o) => (
            <Option key={o.value} value={o.value}>{o.label}</Option>
          ))}
        </Select>
      );
    case 'dependent':
      return <DependentSelect field={field} form={form} />;
    default:
      return <Input placeholder={`Enter ${field.label}`} />;
  }
};

/** Wrap a field in a Form.Item with label + validation */
const SchemaFormItem = ({ field, form, namePrefix }) => {
  const name = namePrefix !== undefined ? [namePrefix, field.name] : field.name;
  return (
    <Form.Item
      name={name}
      label={field.label}
      rules={
        field.required
          ? [{ required: true, message: `${field.label} is required` }]
          : []
      }
    >
      <FieldControl field={field} form={form} />
    </Form.Item>
  );
};

// ─────────────────────────────────────────────────────────
//  SECTION RENDERERS
// ─────────────────────────────────────────────────────────
const FacilitySection = ({ form }) => (
  <Row gutter={[24, 0]}>
    {getFieldsBySection('Facility').map((f) => (
      <Col xs={24} sm={12} key={f.name}>
        <SchemaFormItem field={f} form={form} />
      </Col>
    ))}
  </Row>
);

const ProductSection = ({ form }) => (
  <Row gutter={[24, 0]}>
    {getFieldsBySection('Product').map((f) => (
      <Col xs={24} key={f.name}>
        <SchemaFormItem field={f} form={form} />
      </Col>
    ))}
  </Row>
);

const LocationSection = ({ form }) => {
  const fields = getFieldsBySection('Location');
  return (
    <Row gutter={[24, 0]}>
      {fields.map((f) => (
        <Col
          xs={24}
          sm={['dependent', 'select'].includes(f.type) ? 12 : 12}
          key={f.name}
        >
          <SchemaFormItem field={f} form={form} />
        </Col>
      ))}
    </Row>
  );
};

const ProfessionalsSection = ({ form }) => {
  const profField = SCHEMA.fields.find((f) => f.name === 'professionals');
  const subFields = profField?.fields ?? [];

  return (
    <Form.List name="professionals" initialValue={[{}]}>
      {(listItems, { add, remove }) => (
        <Space direction="vertical" style={{ width: '100%' }} size={16}>
          {listItems.map(({ key, name: idx, ...rest }) => (
            <Card
              key={key}
              size="small"
              style={{ borderRadius: 8 }}
              title={
                <Space>
                  <UserOutlined />
                  <span>Professional {idx + 1}</span>
                </Space>
              }
              extra={
                listItems.length > 1 && (
                  <Button
                    type="text"
                    danger
                    size="small"
                    icon={<MinusCircleOutlined />}
                    onClick={() => remove(idx)}
                  >
                    Remove
                  </Button>
                )
              }
            >
              <Row gutter={[24, 0]}>
                {subFields.map((sf) => (
                  <Col xs={24} sm={12} key={sf.name}>
                    <Form.Item
                      {...rest}
                      name={[idx, sf.name]}
                      label={sf.label}
                      rules={sf.required ? [{ required: true, message: `${sf.label} is required` }] : []}
                    >
                      <FieldControl field={sf} form={form} />
                    </Form.Item>
                  </Col>
                ))}
              </Row>
            </Card>
          ))}

          <Button
            type="dashed"
            onClick={() => add({})}
            block
            icon={<PlusOutlined />}
          >
            Add Professional
          </Button>
        </Space>
      )}
    </Form.List>
  );
};

const ChecklistSection = () => (
  <Alert
    message="Checklist Items"
    description={
      <div>
        <p>Checklist items are generated dynamically by the server based on your facility type, product type, and region.</p>
        <p>They will be available after your initial application is submitted and reviewed.</p>
      </div>
    }
    type="info"
    showIcon
    style={{ borderRadius: 8 }}
  />
);

const ReviewSection = ({ form }) => (
  <Row gutter={[24, 0]}>
    {getFieldsBySection('Review').map((f) => (
      <Col xs={24} sm={12} key={f.name}>
        <SchemaFormItem field={f} form={form} />
      </Col>
    ))}
  </Row>
);

const SectionContent = ({ section, form }) => {
  switch (section) {
    case 'Facility':      return <FacilitySection      form={form} />;
    case 'Product':       return <ProductSection       form={form} />;
    case 'Location':      return <LocationSection      form={form} />;
    case 'Professionals': return <ProfessionalsSection form={form} />;
    case 'Checklist':     return <ChecklistSection />;
    case 'Review':        return <ReviewSection        form={form} />;
    default:              return null;
  }
};

// ─────────────────────────────────────────────────────────
//  VALIDATION FIELD NAMES PER SECTION
// ─────────────────────────────────────────────────────────
const getRequiredFieldNames = (section) => {
  if (section === 'Professionals') return []; // Form.List handles internally
  if (section === 'Checklist') return [];
  return SCHEMA.fields
    .filter((f) => f.section === section && f.required && f.type !== 'group' && f.type !== 'checklist')
    .map((f) => f.name);
};

// ─────────────────────────────────────────────────────────
//  MAIN PAGE
// ─────────────────────────────────────────────────────────
export default function ApplicationFormPage() {
  const [form]         = Form.useForm();
  const [step, setStep]       = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const sections = SCHEMA.sections;

  // ── Navigation ─────────────────────────────────────────
  const goNext = async () => {
    try {
      const fieldsToValidate = getRequiredFieldNames(sections[step]);
      if (fieldsToValidate.length) await form.validateFields(fieldsToValidate);
      setStep((s) => Math.min(s + 1, sections.length - 1));
    } catch {
      message.warning('Please fill in all required fields before proceeding.');
    }
  };

  const goPrev = () => setStep((s) => Math.max(s - 1, 0));

  // ── Submit ─────────────────────────────────────────────
  const handleSubmit = async () => {
    try {
      const allValues = await form.validateFields();
      setSubmitting(true);
      setSubmitError(null);

      // Build nested payload
      const { professionals = [], ...flatRest } = allValues;
      const payload = {
        ...flatToNested(flatRest),
        professionals,
      };

      const res = await fetch(SCHEMA.submitUrl, {
        method: SCHEMA.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSubmitted(true);
        message.success('Application submitted successfully!');
      } else {
        const errData = await res.json().catch(() => null);
        const msg = errData?.message ?? `Server error (${res.status})`;
        setSubmitError(msg);
        message.error(msg);
      }
    } catch (err) {
      if (err?.errorFields?.length) {
        message.warning('Please fill in all required fields.');
      } else {
        setSubmitError('Network error. Please check your connection.');
        message.error('Network error. Please check your connection.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    form.resetFields();
    setStep(0);
    setSubmitted(false);
    setSubmitError(null);
  };

  // ── Success screen ─────────────────────────────────────
  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Result
          status="success"
          title="Application Submitted!"
          subTitle="Your EFDA license application has been received and is under review. You will be notified of any updates."
          extra={[
            <Button type="primary" key="new" onClick={resetForm}>Submit Another Application</Button>,
          ]}
        />
      </div>
    );
  }

  // ── Form ───────────────────────────────────────────────
  return (
    <div style={{ background: '#f5f5f5', minHeight: '100vh', padding: '32px 16px' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>

        {/* Header */}
        <Card bordered={false} style={{ marginBottom: 24, borderRadius: 12 }}>
          <Row align="middle" justify="space-between" wrap>
            <Col>
              <Title level={3} style={{ margin: 0 }}>EFDA iLicense Application</Title>
              <Text type="secondary">Ethiopian Food and Drug Authority — Facility Licensing Portal</Text>
            </Col>
            <Col>
              <Tag color="blue">New Application</Tag>
            </Col>
          </Row>
        </Card>

        {/* Steps */}
        <Card bordered={false} style={{ marginBottom: 24, borderRadius: 12 }}>
          <Steps
            current={step}
            size="small"
            responsive
            items={sections.map((s, i) => ({
              title: s,
              icon: i < step ? undefined : SECTION_ICONS[s],
              status: i < step ? 'finish' : i === step ? 'process' : 'wait',
            }))}
          />
        </Card>

        {/* Section Form */}
        <Card
          bordered={false}
          style={{ marginBottom: 24, borderRadius: 12 }}
          title={
            <Space>
              {SECTION_ICONS[sections[step]]}
              <span style={{ fontSize: 18, fontWeight: 600 }}>{sections[step]}</span>
              <Text type="secondary" style={{ fontWeight: 400, fontSize: 13 }}>
                Step {step + 1} of {sections.length}
              </Text>
            </Space>
          }
        >
          <Form
            form={form}
            layout="vertical"
            requiredMark="optional"
            scrollToFirstError={{ behavior: 'smooth' }}
          >
            <SectionContent section={sections[step]} form={form} />
          </Form>

          {submitError && (
            <Alert
              message="Submission Error"
              description={submitError}
              type="error"
              closable
              onClose={() => setSubmitError(null)}
              style={{ marginTop: 16, borderRadius: 8 }}
            />
          )}
        </Card>

        {/* Navigation */}
        <Card bordered={false} style={{ borderRadius: 12 }}>
          <Row justify="space-between" align="middle">
            <Col>
              <Button
                icon={<LeftOutlined />}
                onClick={goPrev}
                disabled={step === 0}
                size="large"
              >
                Previous
              </Button>
            </Col>

            <Col>
              <Text type="secondary">
                {step + 1} / {sections.length}
              </Text>
            </Col>

            <Col>
              {step < sections.length - 1 ? (
                <Button
                  type="primary"
                  size="large"
                  onClick={goNext}
                >
                  Next <RightOutlined />
                </Button>
              ) : (
                <Button
                  type="primary"
                  size="large"
                  icon={<SendOutlined />}
                  loading={submitting}
                  onClick={handleSubmit}
                >
                  {submitting ? 'Submitting…' : 'Submit Application'}
                </Button>
              )}
            </Col>
          </Row>
        </Card>

      </div>
    </div>
  );
}