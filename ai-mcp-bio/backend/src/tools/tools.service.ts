import { Injectable } from '@nestjs/common';

@Injectable()
export class ToolsService {
  private readonly tools = [
    {
      id: 'blast',
      name: 'BLAST',
      description: 'Basic Local Alignment Search Tool',
      category: 'Sequence Analysis',
    },
    {
      id: 'alphafold',
      name: 'AlphaFold',
      description: 'Protein structure prediction system',
      category: 'Structural Analysis',
    },
    {
      id: 'bwa',
      name: 'BWA',
      description: 'Burrows-Wheeler Aligner for short sequence alignment',
      category: 'Genomics',
    },
    {
      id: 'phylo',
      name: 'PhyML',
      description: 'Phylogenetic estimation using Maximum Likelihood',
      category: 'Phylogenetics',
    },
  ];

  findAll() {
    return this.tools;
  }

  findOne(id: string) {
    return this.tools.find(tool => tool.id === id);
  }
} 