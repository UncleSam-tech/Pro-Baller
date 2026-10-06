export interface SquadPlayer {
  id: string;
  name: string;
  position: 'GK' | 'LB' | 'CB' | 'RB' | 'CDM' | 'CM' | 'CAM' | 'LW' | 'RW' | 'ST';
  number: number;
  overall: number;
  nationality: string;
}

export interface ClubRosterData {
  startingXI: SquadPlayer[];
  bench: SquadPlayer[];
}

export const REAL_CLUB_ROSTERS: Record<string, ClubRosterData> = {
  // --- PREMIER LEAGUE ---
  arsenal: {
    startingXI: [
      { id: 'ars_1', name: 'David Raya', position: 'GK', number: 22, overall: 86, nationality: 'Spain' },
      { id: 'ars_2', name: 'Ben White', position: 'RB', number: 4, overall: 84, nationality: 'England' },
      { id: 'ars_3', name: 'William Saliba', position: 'CB', number: 2, overall: 88, nationality: 'France' },
      { id: 'ars_4', name: 'Gabriel Magalhães', position: 'CB', number: 6, overall: 87, nationality: 'Brazil' },
      { id: 'ars_5', name: 'Jurriën Timber', position: 'LB', number: 12, overall: 82, nationality: 'Netherlands' },
      { id: 'ars_6', name: 'Thomas Partey', position: 'CDM', number: 5, overall: 83, nationality: 'Ghana' },
      { id: 'ars_7', name: 'Declan Rice', position: 'CM', number: 41, overall: 88, nationality: 'England' },
      { id: 'ars_8', name: 'Martin Ødegaard', position: 'CAM', number: 8, overall: 89, nationality: 'Norway' },
      { id: 'ars_9', name: 'Bukayo Saka', position: 'RW', number: 7, overall: 89, nationality: 'England' },
      { id: 'ars_10', name: 'Kai Havertz', position: 'ST', number: 29, overall: 85, nationality: 'Germany' },
      { id: 'ars_11', name: 'Gabriel Martinelli', position: 'LW', number: 11, overall: 85, nationality: 'Brazil' },
    ],
    bench: [
      { id: 'ars_sub1', name: 'Neto', position: 'GK', number: 32, overall: 78, nationality: 'Brazil' },
      { id: 'ars_sub2', name: 'Takehiro Tomiyasu', position: 'RB', number: 18, overall: 81, nationality: 'Japan' },
      { id: 'ars_sub3', name: 'Jakub Kiwior', position: 'CB', number: 15, overall: 79, nationality: 'Poland' },
      { id: 'ars_sub4', name: 'Jorginho', position: 'CDM', number: 20, overall: 81, nationality: 'Italy' },
      { id: 'ars_sub5', name: 'Mikel Merino', position: 'CM', number: 23, overall: 83, nationality: 'Spain' },
      { id: 'ars_sub6', name: 'Leandro Trossard', position: 'LW', number: 19, overall: 84, nationality: 'Belgium' },
      { id: 'ars_sub7', name: 'Raheem Sterling', position: 'RW', number: 30, overall: 82, nationality: 'England' },
      { id: 'ars_sub8', name: 'Gabriel Jesus', position: 'ST', number: 9, overall: 83, nationality: 'Brazil' },
      { id: 'ars_sub9', name: 'Ethan Nwaneri', position: 'CAM', number: 53, overall: 74, nationality: 'England' },
    ],
  },
  man_city: {
    startingXI: [
      { id: 'mci_1', name: 'Ederson', position: 'GK', number: 31, overall: 88, nationality: 'Brazil' },
      { id: 'mci_2', name: 'Kyle Walker', position: 'RB', number: 2, overall: 83, nationality: 'England' },
      { id: 'mci_3', name: 'Rúben Dias', position: 'CB', number: 3, overall: 89, nationality: 'Portugal' },
      { id: 'mci_4', name: 'Manuel Akanji', position: 'CB', number: 25, overall: 85, nationality: 'Switzerland' },
      { id: 'mci_5', name: 'Josko Gvardiol', position: 'LB', number: 24, overall: 86, nationality: 'Croatia' },
      { id: 'mci_6', name: 'Rodri', position: 'CDM', number: 16, overall: 91, nationality: 'Spain' },
      { id: 'mci_7', name: 'Mateo Kovacic', position: 'CM', number: 8, overall: 84, nationality: 'Croatia' },
      { id: 'mci_8', name: 'Kevin De Bruyne', position: 'CAM', number: 17, overall: 90, nationality: 'Belgium' },
      { id: 'mci_9', name: 'Bernardo Silva', position: 'RW', number: 20, overall: 88, nationality: 'Portugal' },
      { id: 'mci_10', name: 'Erling Haaland', position: 'ST', number: 9, overall: 92, nationality: 'Norway' },
      { id: 'mci_11', name: 'Phil Foden', position: 'LW', number: 47, overall: 89, nationality: 'England' },
    ],
    bench: [
      { id: 'mci_sub1', name: 'Stefan Ortega', position: 'GK', number: 18, overall: 80, nationality: 'Germany' },
      { id: 'mci_sub2', name: 'John Stones', position: 'CB', number: 5, overall: 86, nationality: 'England' },
      { id: 'mci_sub3', name: 'Nathan Aké', position: 'LB', number: 6, overall: 83, nationality: 'Netherlands' },
      { id: 'mci_sub4', name: 'Rico Lewis', position: 'RB', number: 82, overall: 78, nationality: 'England' },
      { id: 'mci_sub5', name: 'Ilkay Gündogan', position: 'CM', number: 19, overall: 86, nationality: 'Germany' },
      { id: 'mci_sub6', name: 'Matheus Nunes', position: 'CM', number: 27, overall: 80, nationality: 'Portugal' },
      { id: 'mci_sub7', name: 'Savinho', position: 'RW', number: 26, overall: 82, nationality: 'Brazil' },
      { id: 'mci_sub8', name: 'Jack Grealish', position: 'LW', number: 10, overall: 84, nationality: 'England' },
      { id: 'mci_sub9', name: 'Jeremy Doku', position: 'LW', number: 11, overall: 83, nationality: 'Belgium' },
    ],
  },
  liverpool: {
    startingXI: [
      { id: 'liv_1', name: 'Alisson Becker', position: 'GK', number: 1, overall: 89, nationality: 'Brazil' },
      { id: 'liv_2', name: 'Trent Alexander-Arnold', position: 'RB', number: 66, overall: 88, nationality: 'England' },
      { id: 'liv_3', name: 'Ibrahima Konaté', position: 'CB', number: 5, overall: 85, nationality: 'France' },
      { id: 'liv_4', name: 'Virgil van Dijk', position: 'CB', number: 4, overall: 90, nationality: 'Netherlands' },
      { id: 'liv_5', name: 'Andy Robertson', position: 'LB', number: 26, overall: 85, nationality: 'Scotland' },
      { id: 'liv_6', name: 'Ryan Gravenberch', position: 'CDM', number: 38, overall: 84, nationality: 'Netherlands' },
      { id: 'liv_7', name: 'Alexis Mac Allister', position: 'CM', number: 10, overall: 87, nationality: 'Argentina' },
      { id: 'liv_8', name: 'Dominik Szoboszlai', position: 'CAM', number: 8, overall: 84, nationality: 'Hungary' },
      { id: 'liv_9', name: 'Mohamed Salah', position: 'RW', number: 11, overall: 90, nationality: 'Egypt' },
      { id: 'liv_10', name: 'Darwin Núñez', position: 'ST', number: 9, overall: 83, nationality: 'Uruguay' },
      { id: 'liv_11', name: 'Luis Díaz', position: 'LW', number: 7, overall: 86, nationality: 'Colombia' },
    ],
    bench: [
      { id: 'liv_sub1', name: 'Caoimhin Kelleher', position: 'GK', number: 62, overall: 80, nationality: 'Ireland' },
      { id: 'liv_sub2', name: 'Joe Gomez', position: 'CB', number: 2, overall: 80, nationality: 'England' },
      { id: 'liv_sub3', name: 'Kostas Tsimikas', position: 'LB', number: 21, overall: 79, nationality: 'Greece' },
      { id: 'liv_sub4', name: 'Conor Bradley', position: 'RB', number: 84, overall: 78, nationality: 'Northern Ireland' },
      { id: 'liv_sub5', name: 'Wataru Endo', position: 'CDM', number: 3, overall: 80, nationality: 'Japan' },
      { id: 'liv_sub6', name: 'Curtis Jones', position: 'CM', number: 17, overall: 81, nationality: 'England' },
      { id: 'liv_sub7', name: 'Harvey Elliott', position: 'CAM', number: 19, overall: 80, nationality: 'England' },
      { id: 'liv_sub8', name: 'Cody Gakpo', position: 'LW', number: 18, overall: 84, nationality: 'Netherlands' },
      { id: 'liv_sub9', name: 'Federico Chiesa', position: 'RW', number: 14, overall: 82, nationality: 'Italy' },
    ],
  },

  // --- NPFL (NIGERIA PREMIER FOOTBALL LEAGUE) ---
  sporting_lagos: {
    startingXI: [
      { id: 'sla_1', name: 'Christian Nwoke', position: 'GK', number: 1, overall: 65, nationality: 'Nigeria' },
      { id: 'sla_2', name: 'Alhassan Rabiu', position: 'RB', number: 2, overall: 64, nationality: 'Nigeria' },
      { id: 'sla_3', name: 'Patrick Echezona', position: 'CB', number: 5, overall: 66, nationality: 'Nigeria' },
      { id: 'sla_4', name: 'Ekene Olisema', position: 'CB', number: 6, overall: 65, nationality: 'Nigeria' },
      { id: 'sla_5', name: 'Mike Zaruma', position: 'LB', number: 3, overall: 63, nationality: 'Nigeria' },
      { id: 'sla_6', name: 'Emeka Onyema', position: 'CDM', number: 4, overall: 65, nationality: 'Nigeria' },
      { id: 'sla_7', name: 'Tochukwu Michael', position: 'CM', number: 8, overall: 67, nationality: 'Nigeria' },
      { id: 'sla_8', name: 'Rivio Ayemwenre', position: 'CAM', number: 10, overall: 66, nationality: 'Nigeria' },
      { id: 'sla_9', name: 'Clement Naantaum', position: 'RW', number: 7, overall: 64, nationality: 'Nigeria' },
      { id: 'sla_10', name: 'Junior Lokosa', position: 'ST', number: 9, overall: 68, nationality: 'Nigeria' },
      { id: 'sla_11', name: 'Jonathan Alukwu', position: 'LW', number: 11, overall: 67, nationality: 'Nigeria' },
    ],
    bench: [
      { id: 'sla_b1', name: 'Agbor Ekoi', position: 'GK', number: 23, overall: 62, nationality: 'Nigeria' },
      { id: 'sla_b2', name: 'Chiemeka Nwokeji', position: 'RB', number: 14, overall: 63, nationality: 'Nigeria' },
      { id: 'sla_b3', name: 'Wisdom Fernando', position: 'LW', number: 17, overall: 64, nationality: 'Nigeria' },
      { id: 'sla_b4', name: 'Emmanuel Odafi', position: 'CB', number: 15, overall: 63, nationality: 'Nigeria' },
      { id: 'sla_b5', name: 'Akpes Gowon', position: 'CM', number: 20, overall: 62, nationality: 'Nigeria' },
      { id: 'sla_b6', name: 'Godwin Odibo', position: 'ST', number: 19, overall: 63, nationality: 'Nigeria' },
      { id: 'sla_b7', name: 'Chisom Orji', position: 'CAM', number: 21, overall: 62, nationality: 'Nigeria' },
      { id: 'sla_b8', name: 'Philip Odubola', position: 'ST', number: 27, overall: 61, nationality: 'Nigeria' },
      { id: 'sla_b9', name: 'Isaac Annor', position: 'RW', number: 22, overall: 62, nationality: 'Ghana' },
    ],
  },
  remo_stars: {
    startingXI: [
      { id: 'rsf_1', name: 'Kayode Bankole', position: 'GK', number: 1, overall: 68, nationality: 'Nigeria' },
      { id: 'rsf_2', name: 'Sodiq Ismail', position: 'RB', number: 2, overall: 69, nationality: 'Nigeria' },
      { id: 'rsf_3', name: 'Nduka Junior', position: 'CB', number: 5, overall: 68, nationality: 'Nigeria' },
      { id: 'rsf_4', name: 'Ahmed Akinyele', position: 'CB', number: 6, overall: 67, nationality: 'Nigeria' },
      { id: 'rsf_5', name: 'Seun Ogunribide', position: 'LB', number: 3, overall: 66, nationality: 'Nigeria' },
      { id: 'rsf_6', name: 'Dayo Ojo', position: 'CDM', number: 4, overall: 67, nationality: 'Nigeria' },
      { id: 'rsf_7', name: 'Qudus Akanni', position: 'CM', number: 8, overall: 66, nationality: 'Nigeria' },
      { id: 'rsf_8', name: 'Franck Mawuena', position: 'CAM', number: 10, overall: 67, nationality: 'Togo' },
      { id: 'rsf_9', name: 'Adams Olamilekan', position: 'RW', number: 7, overall: 66, nationality: 'Nigeria' },
      { id: 'rsf_10', name: 'Sikiru Alimi', position: 'ST', number: 9, overall: 69, nationality: 'Nigeria' },
      { id: 'rsf_11', name: 'Dela Akorli', position: 'LW', number: 11, overall: 65, nationality: 'Ghana' },
    ],
    bench: [
      { id: 'rsf_b1', name: 'Vincent Edafe', position: 'GK', number: 16, overall: 63, nationality: 'Nigeria' },
      { id: 'rsf_b2', name: 'Victor Collins', position: 'CB', number: 15, overall: 65, nationality: 'Nigeria' },
      { id: 'rsf_b3', name: 'Ibrahim Abubakar', position: 'LB', number: 13, overall: 64, nationality: 'Nigeria' },
      { id: 'rsf_b4', name: 'Alex Oyowah', position: 'CM', number: 14, overall: 65, nationality: 'Nigeria' },
      { id: 'rsf_b5', name: 'Samad Kadiri', position: 'ST', number: 19, overall: 65, nationality: 'Nigeria' },
      { id: 'rsf_b6', name: 'Olamilekan Adedayo', position: 'RW', number: 21, overall: 64, nationality: 'Nigeria' },
      { id: 'rsf_b7', name: 'Hadi Haruna', position: 'CAM', number: 20, overall: 63, nationality: 'Nigeria' },
      { id: 'rsf_b8', name: 'Thankgod Ikeagwu', position: 'ST', number: 25, overall: 63, nationality: 'Nigeria' },
      { id: 'rsf_b9', name: 'Jide Fatokun', position: 'CDM', number: 18, overall: 64, nationality: 'Nigeria' },
    ],
  },
  enyimba: {
    startingXI: [
      { id: 'eny_1', name: 'Ojo Olorunleke', position: 'GK', number: 1, overall: 70, nationality: 'Nigeria' },
      { id: 'eny_2', name: 'Pascal Eze', position: 'RB', number: 2, overall: 67, nationality: 'Nigeria' },
      { id: 'eny_3', name: 'Somtochukwu Uche', position: 'CB', number: 5, overall: 68, nationality: 'Nigeria' },
      { id: 'eny_4', name: 'Innocent Gabriel', position: 'CB', number: 6, overall: 67, nationality: 'Nigeria' },
      { id: 'eny_5', name: 'Imo Obot', position: 'LB', number: 3, overall: 66, nationality: 'Nigeria' },
      { id: 'eny_6', name: 'Daniel Daga', position: 'CDM', number: 4, overall: 69, nationality: 'Nigeria' },
      { id: 'eny_7', name: 'Elijah Akanni', position: 'CM', number: 8, overall: 67, nationality: 'Nigeria' },
      { id: 'eny_8', name: 'Mbaoma Chijioke', position: 'CAM', number: 10, overall: 71, nationality: 'Nigeria' },
      { id: 'eny_9', name: 'Joseph Atule', position: 'RW', number: 7, overall: 68, nationality: 'Nigeria' },
      { id: 'eny_10', name: 'Chidiebere Nnodu', position: 'ST', number: 9, overall: 68, nationality: 'Nigeria' },
      { id: 'eny_11', name: 'Ekene Awazie', position: 'LW', number: 11, overall: 67, nationality: 'Nigeria' },
    ],
    bench: [
      { id: 'eny_b1', name: 'Ani Ozoemena', position: 'GK', number: 21, overall: 64, nationality: 'Nigeria' },
      { id: 'eny_b2', name: 'Chibuike Nwaiwu', position: 'CB', number: 14, overall: 66, nationality: 'Nigeria' },
      { id: 'eny_b3', name: 'Folarin Temitope', position: 'LB', number: 13, overall: 64, nationality: 'Nigeria' },
      { id: 'eny_b4', name: 'Chukwudi Nworgu', position: 'CM', number: 17, overall: 65, nationality: 'Nigeria' },
      { id: 'eny_b5', name: 'Anthony Okachi', position: 'ST', number: 19, overall: 66, nationality: 'Nigeria' },
      { id: 'eny_b6', name: 'Bernard Ovoke', position: 'LW', number: 22, overall: 65, nationality: 'Nigeria' },
      { id: 'eny_b7', name: 'Chukwuebuka Mbah', position: 'RW', number: 20, overall: 64, nationality: 'Nigeria' },
      { id: 'eny_b8', name: 'Kalu Nweke', position: 'CAM', number: 24, overall: 64, nationality: 'Nigeria' },
      { id: 'eny_b9', name: 'David Philip', position: 'CDM', number: 18, overall: 65, nationality: 'Nigeria' },
    ],
  },
  rivers_united: {
    startingXI: [
      { id: 'riv_1', name: 'Victor Sochima', position: 'GK', number: 1, overall: 68, nationality: 'Nigeria' },
      { id: 'riv_2', name: 'Kazie Enyinnaya', position: 'RB', number: 2, overall: 66, nationality: 'Nigeria' },
      { id: 'riv_3', name: 'Temple Emekayi', position: 'CB', number: 5, overall: 67, nationality: 'Nigeria' },
      { id: 'riv_4', name: 'Austin Opara', position: 'CB', number: 6, overall: 66, nationality: 'Nigeria' },
      { id: 'riv_5', name: 'Paul Acquah', position: 'LB', number: 3, overall: 67, nationality: 'Ghana' },
      { id: 'riv_6', name: 'Alex Oyowah', position: 'CDM', number: 4, overall: 67, nationality: 'Nigeria' },
      { id: 'riv_7', name: 'Shedrack Asiegbu', position: 'CM', number: 8, overall: 66, nationality: 'Nigeria' },
      { id: 'riv_8', name: 'Samuel Antwi', position: 'CAM', number: 10, overall: 67, nationality: 'Ghana' },
      { id: 'riv_9', name: 'Deputy Echeta', position: 'RW', number: 7, overall: 68, nationality: 'Nigeria' },
      { id: 'riv_10', name: 'Nyima Nwagua', position: 'ST', number: 9, overall: 68, nationality: 'Nigeria' },
      { id: 'riv_11', name: 'Albert Korvah', position: 'LW', number: 11, overall: 67, nationality: 'Liberia' },
    ],
    bench: [
      { id: 'riv_b1', name: 'Abiodun Akande', position: 'GK', number: 16, overall: 64, nationality: 'Nigeria' },
      { id: 'riv_b2', name: 'Endurance Ebedebiri', position: 'CB', number: 14, overall: 65, nationality: 'Nigeria' },
      { id: 'riv_b3', name: 'Bolaji Sakin', position: 'ST', number: 19, overall: 65, nationality: 'Nigeria' },
      { id: 'riv_b4', name: 'Maurice Chukwu', position: 'CM', number: 17, overall: 64, nationality: 'Nigeria' },
      { id: 'riv_b5', name: 'Lukman Adefemi', position: 'ST', number: 20, overall: 64, nationality: 'Nigeria' },
      { id: 'riv_b6', name: 'Chiamaka Madu', position: 'CAM', number: 22, overall: 65, nationality: 'Nigeria' },
      { id: 'riv_b7', name: 'Bamba Bakary', position: 'LB', number: 13, overall: 63, nationality: 'Ivory Coast' },
      { id: 'riv_b8', name: 'Gideon Trokon', position: 'RW', number: 21, overall: 63, nationality: 'Liberia' },
      { id: 'riv_b9', name: 'Emmanuel Ampiah', position: 'CB', number: 15, overall: 64, nationality: 'Ghana' },
    ],
  },
  rangers_intl: {
    startingXI: [
      { id: 'ran_1', name: 'Japhet Opubo', position: 'GK', number: 1, overall: 67, nationality: 'Nigeria' },
      { id: 'ran_2', name: 'Joel Odoh', position: 'RB', number: 2, overall: 65, nationality: 'Nigeria' },
      { id: 'ran_3', name: 'Kenneth Igboke', position: 'CB', number: 5, overall: 67, nationality: 'Nigeria' },
      { id: 'ran_4', name: 'Stephen Onyah', position: 'CB', number: 6, overall: 66, nationality: 'Nigeria' },
      { id: 'ran_5', name: 'Philip Clement', position: 'LB', number: 3, overall: 65, nationality: 'Nigeria' },
      { id: 'ran_6', name: 'Kalu Nweke', position: 'CDM', number: 4, overall: 66, nationality: 'Nigeria' },
      { id: 'ran_7', name: 'Isaac Saviour', position: 'CM', number: 8, overall: 67, nationality: 'Nigeria' },
      { id: 'ran_8', name: 'Kazeem Ogunleye', position: 'CAM', number: 10, overall: 68, nationality: 'Nigeria' },
      { id: 'ran_9', name: 'Chidiebere Nwobodo', position: 'RW', number: 7, overall: 67, nationality: 'Nigeria' },
      { id: 'ran_10', name: 'Godwin Obaje', position: 'ST', number: 9, overall: 68, nationality: 'Nigeria' },
      { id: 'ran_11', name: 'Naziru Auwalu', position: 'LW', number: 11, overall: 66, nationality: 'Nigeria' },
    ],
    bench: [
      { id: 'ran_b1', name: 'Detan Ogundare', position: 'GK', number: 16, overall: 63, nationality: 'Nigeria' },
      { id: 'ran_b2', name: 'Austin Obaroakpo', position: 'CB', number: 14, overall: 65, nationality: 'Nigeria' },
      { id: 'ran_b3', name: 'Chimobi Igwilo', position: 'ST', number: 19, overall: 64, nationality: 'Nigeria' },
      { id: 'ran_b4', name: 'Chinemerem Ugwueze', position: 'CM', number: 17, overall: 64, nationality: 'Nigeria' },
      { id: 'ran_b5', name: 'Frank Uwumiro', position: 'ST', number: 20, overall: 64, nationality: 'Nigeria' },
      { id: 'ran_b6', name: 'Ugochukwu Ugwuoke', position: 'CAM', number: 22, overall: 63, nationality: 'Nigeria' },
      { id: 'ran_b7', name: 'Ebuka Anthony', position: 'LB', number: 13, overall: 63, nationality: 'Nigeria' },
      { id: 'ran_b8', name: 'Chukwuebuka Okorie', position: 'RW', number: 21, overall: 63, nationality: 'Nigeria' },
      { id: 'ran_b9', name: 'Kingsley Madu', position: 'RB', number: 15, overall: 63, nationality: 'Nigeria' },
    ],
  },

  // --- LA LIGA ---
  real_madrid: {
    startingXI: [
      { id: 'rma_1', name: 'Thibaut Courtois', position: 'GK', number: 1, overall: 90, nationality: 'Belgium' },
      { id: 'rma_2', name: 'Dani Carvajal', position: 'RB', number: 2, overall: 86, nationality: 'Spain' },
      { id: 'rma_3', name: 'Éder Militão', position: 'CB', number: 3, overall: 87, nationality: 'Brazil' },
      { id: 'rma_4', name: 'Antonio Rüdiger', position: 'CB', number: 22, overall: 88, nationality: 'Germany' },
      { id: 'rma_5', name: 'Ferland Mendy', position: 'LB', number: 23, overall: 83, nationality: 'France' },
      { id: 'rma_6', name: 'Aurélien Tchouaméni', position: 'CDM', number: 14, overall: 87, nationality: 'France' },
      { id: 'rma_7', name: 'Federico Valverde', position: 'CM', number: 8, overall: 89, nationality: 'Uruguay' },
      { id: 'rma_8', name: 'Jude Bellingham', position: 'CAM', number: 5, overall: 91, nationality: 'England' },
      { id: 'rma_9', name: 'Rodrygo', position: 'RW', number: 11, overall: 86, nationality: 'Brazil' },
      { id: 'rma_10', name: 'Kylian Mbappé', position: 'ST', number: 9, overall: 92, nationality: 'France' },
      { id: 'rma_11', name: 'Vinícius Júnior', position: 'LW', number: 7, overall: 91, nationality: 'Brazil' },
    ],
    bench: [
      { id: 'rma_b1', name: 'Andriy Lunin', position: 'GK', number: 13, overall: 82, nationality: 'Ukraine' },
      { id: 'rma_b2', name: 'David Alaba', position: 'CB', number: 4, overall: 84, nationality: 'Austria' },
      { id: 'rma_b3', name: 'Lucas Vázquez', position: 'RB', number: 17, overall: 81, nationality: 'Spain' },
      { id: 'rma_b4', name: 'Eduardo Camavinga', position: 'CM', number: 6, overall: 86, nationality: 'France' },
      { id: 'rma_b5', name: 'Luka Modrić', position: 'CM', number: 10, overall: 85, nationality: 'Croatia' },
      { id: 'rma_b6', name: 'Brahim Díaz', position: 'CAM', number: 21, overall: 83, nationality: 'Morocco' },
      { id: 'rma_b7', name: 'Arda Güler', position: 'CAM', number: 15, overall: 81, nationality: 'Turkey' },
      { id: 'rma_b8', name: 'Endrick', position: 'ST', number: 16, overall: 79, nationality: 'Brazil' },
      { id: 'rma_b9', name: 'Fran García', position: 'LB', number: 20, overall: 79, nationality: 'Spain' },
    ],
  },
  barcelona: {
    startingXI: [
      { id: 'bar_1', name: 'Marc-André ter Stegen', position: 'GK', number: 1, overall: 89, nationality: 'Germany' },
      { id: 'bar_2', name: 'Jules Koundé', position: 'RB', number: 23, overall: 86, nationality: 'France' },
      { id: 'bar_3', name: 'Pau Cubarsí', position: 'CB', number: 2, overall: 82, nationality: 'Spain' },
      { id: 'bar_4', name: 'Iñigo Martínez', position: 'CB', number: 5, overall: 83, nationality: 'Spain' },
      { id: 'bar_5', name: 'Alejandro Balde', position: 'LB', number: 3, overall: 83, nationality: 'Spain' },
      { id: 'bar_6', name: 'Marc Casadó', position: 'CDM', number: 17, overall: 81, nationality: 'Spain' },
      { id: 'bar_7', name: 'Pedri', position: 'CM', number: 8, overall: 88, nationality: 'Spain' },
      { id: 'bar_8', name: 'Dani Olmo', position: 'CAM', number: 20, overall: 86, nationality: 'Spain' },
      { id: 'bar_9', name: 'Lamine Yamal', position: 'RW', number: 19, overall: 87, nationality: 'Spain' },
      { id: 'bar_10', name: 'Robert Lewandowski', position: 'ST', number: 9, overall: 89, nationality: 'Poland' },
      { id: 'bar_11', name: 'Raphinha', position: 'LW', number: 11, overall: 88, nationality: 'Brazil' },
    ],
    bench: [
      { id: 'bar_b1', name: 'Iñaki Peña', position: 'GK', number: 13, overall: 78, nationality: 'Spain' },
      { id: 'bar_b2', name: 'Andreas Christensen', position: 'CB', number: 15, overall: 82, nationality: 'Denmark' },
      { id: 'bar_b3', name: 'Ronald Araújo', position: 'CB', number: 4, overall: 86, nationality: 'Uruguay' },
      { id: 'bar_b4', name: 'Frenkie de Jong', position: 'CM', number: 21, overall: 87, nationality: 'Netherlands' },
      { id: 'bar_b5', name: 'Gavi', position: 'CM', number: 6, overall: 84, nationality: 'Spain' },
      { id: 'bar_b6', name: 'Fermín López', position: 'CAM', number: 16, overall: 81, nationality: 'Spain' },
      { id: 'bar_b7', name: 'Ferran Torres', position: 'RW', number: 7, overall: 82, nationality: 'Spain' },
      { id: 'bar_b8', name: 'Ansu Fati', position: 'LW', number: 10, overall: 79, nationality: 'Spain' },
      { id: 'bar_b9', name: 'Pau Víctor', position: 'ST', number: 18, overall: 75, nationality: 'Spain' },
    ],
  },
};

/**
 * Fallback generator for clubs that do not have a hardcoded roster
 */
export function getClubRoster(clubId: string, clubName: string, clubRep: number): ClubRosterData {
  if (REAL_CLUB_ROSTERS[clubId]) {
    return REAL_CLUB_ROSTERS[clubId];
  }

  // Generate sensible roster based on club reputation
  const baseRating = Math.max(58, Math.min(88, Math.round(clubRep * 0.9)));
  const positions: SquadPlayer['position'][] = [
    'GK', 'RB', 'CB', 'CB', 'LB', 'CDM', 'CM', 'CAM', 'RW', 'ST', 'LW'
  ];

  const firstNames = ['Lucas', 'Alex', 'David', 'Mateo', 'Daniel', 'Liam', 'Noah', 'Gabriel', 'Julian', 'Marco', 'Victor'];
  const lastNames = ['Santos', 'Silva', 'Müller', 'Johnson', 'Rossi', 'Fernández', 'Okafor', 'Bailly', 'Jensen', 'Díaz', 'Kowalski'];

  const startingXI: SquadPlayer[] = positions.map((pos, idx) => ({
    id: `${clubId}_gen_${idx}`,
    name: `${firstNames[idx % firstNames.length]} ${lastNames[(idx + 2) % lastNames.length]}`,
    position: pos,
    number: idx === 0 ? 1 : idx + 1,
    overall: Math.min(92, Math.max(55, baseRating + (idx % 3 === 0 ? 2 : idx % 2 === 0 ? -1 : 0))),
    nationality: 'International',
  }));

  const bench: SquadPlayer[] = [
    { id: `${clubId}_sub_1`, name: 'Marc Bennett', position: 'GK', number: 12, overall: baseRating - 4, nationality: 'Domestic' },
    { id: `${clubId}_sub_2`, name: 'Hugo Lindqvist', position: 'CB', number: 14, overall: baseRating - 3, nationality: 'Domestic' },
    { id: `${clubId}_sub_3`, name: 'Milan Stankovic', position: 'LB', number: 15, overall: baseRating - 3, nationality: 'Domestic' },
    { id: `${clubId}_sub_4`, name: 'Kwame Boateng', position: 'CDM', number: 16, overall: baseRating - 2, nationality: 'Domestic' },
    { id: `${clubId}_sub_5`, name: 'Carlos Ortega', position: 'CM', number: 18, overall: baseRating - 2, nationality: 'Domestic' },
    { id: `${clubId}_sub_6`, name: 'Sammy Vance', position: 'RW', number: 20, overall: baseRating - 3, nationality: 'Domestic' },
    { id: `${clubId}_sub_7`, name: 'Rasmus Høj', position: 'ST', number: 21, overall: baseRating - 2, nationality: 'Domestic' },
  ];

  return { startingXI, bench };
}
