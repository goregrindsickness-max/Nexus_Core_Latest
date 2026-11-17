import { describe, it, expect } from 'vitest';
import {
  isAudioAssetFilename,
  matchVaultFileToTrack,
  normalizeCatalogTitleKey,
  parseVaultFilenameMetadata,
  stripVaultFilenamePrefix,
} from '../utils/audioVaultCatalog';

describe('audioVaultCatalog track matching and metadata parsing', () => {
  const realReleaseTracks = [
    { id: 'trk-1', title: 'Symbiotic Voracity (Virulent Excision)', duration: '4:04' },
    { id: 'trk-2', title: 'Xenomorphic Trepidation (Virulent Excision)', duration: '3:39' },
    { id: 'trk-3', title: 'Hierarchy of Foul Mutilation (Facelife Deformation)', duration: '2:24' },
    { id: 'trk-4', title: 'Posthuman Demoniac Parasitism (Facelift Deformation)', duration: '3:20' },
    { id: 'trk-5', title: 'Neutron Star Collapse (Gravitational Distortion)', duration: '3:01' },
    { id: 'trk-6', title: 'Compressed to a Singularity (Gravitational Distortion)', duration: '3:52' },
    { id: 'trk-7', title: 'The Sign of... (Gerogot)', duration: '3:14' },
    { id: 'trk-8', title: 'Unpredictable (Gerogot)', duration: '3:19' },
  ];

  const vaultFiles = [
    '1786816667033_jj9a87_Virulent_Excision_-01-_Symbiotic_Voracity.mp3',
    '1786816896483_7uuvls_Virulent_Excision_-02-_Xenomorphic_Trepidation.mp3',
    '1786816941870_yipee1_Facelift_Deformation_-_01_-_Hierarchy_of_Foul_Mutilation.mp3',
    '1786816987537_yymg98_Facelift_Deformation_-_02_-_Posthuman_Demoniac_Parasitism.mp3',
    '1786817027100_hj3wq7_Gravitational_Distortion_-_01_-_Neutron_Star_Collapse.mp3',
    '1786817070002_yw139z_Gravitational_Distortion_-_02_-_Compressed_to_Singularity.mp3',
    '1786817113793_krb7rb_Gerogot_-_01_-_The_Sign_Of....mp3',
    '1786817137326_4sj0c0_Gerogot_-_02_-_Unpredictable.mp3',
  ];

  it('matches all 8 Heinous Interstellar Malformations MP3s to their corresponding release tracks', () => {
    vaultFiles.forEach((fileName, expectedIdx) => {
      expect(isAudioAssetFilename(fileName)).toBe(true);
      expect(matchVaultFileToTrack(fileName, realReleaseTracks)).toBe(expectedIdx);
    });
  });

  it('strips upload prefixes cleanly and detects Virulent Excision standalone vault masters', () => {
    expect(
      stripVaultFilenamePrefix('1790019387072_zzi1zi_VE_Extermination_Protocol__Jason1_.mp3')
    ).toBe('VE Extermination Protocol Jason1');

    expect(
      parseVaultFilenameMetadata('1790019387072_zzi1zi_VE_Extermination_Protocol__Jason1_.mp3')
    ).toEqual({
      title: 'Extermination Protocol Jason1',
      band: 'Virulent Excision',
    });

    expect(normalizeCatalogTitleKey('Heinous Interstellar Malformations')).toBe(
      'heinousinterstellarmalformations'
    );
  });
});
