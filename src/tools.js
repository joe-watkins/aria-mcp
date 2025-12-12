// ARIA MCP Tools - Comprehensive accessibility specification tools
// Import ARIA data generated from W3C specification
import data from '../data/aria-data.json' with { type: 'json' };

/**
 * Helper to create text response
 */
function textResponse(text) {
  return {
    content: [{ type: 'text', text }]
  };
}

/**
 * Format role details for display
 */
function formatRoleDetails(role, verbose = false) {
  let output = `## ${role.name}\n\n`;
  output += `**Category:** ${role.category || 'unknown'}\n`;
  output += `**Abstract:** ${role.isAbstract ? 'Yes' : 'No'}\n\n`;
  
  if (role.description) {
    output += `### Description\n${role.description}\n\n`;
  }
  
  if (role.superclassRoles?.length) {
    output += `**Superclass Roles:** ${role.superclassRoles.join(', ')}\n`;
  }
  
  if (role.subclassRoles?.length) {
    output += `**Subclass Roles:** ${role.subclassRoles.join(', ')}\n`;
  }
  
  if (role.requiredContextRole?.length) {
    output += `**Required Context Role:** ${role.requiredContextRole.join(', ')}\n`;
  }
  
  if (role.requiredOwnedElements?.length) {
    output += `**Required Owned Elements:** ${role.requiredOwnedElements.join(', ')}\n`;
  }
  
  output += `**Accessible Name Required:** ${role.accessibleNameRequired ? 'Yes' : 'No'}\n`;
  output += `**Children Presentational:** ${role.childrenPresentational ? 'Yes' : 'No'}\n`;
  
  if (role.nameFrom?.length) {
    output += `**Name From:** ${role.nameFrom.join(', ')}\n`;
  }
  
  if (verbose && role.allProps?.length) {
    output += `\n### Supported States and Properties\n`;
    const required = role.allProps.filter(p => p.required);
    const optional = role.allProps.filter(p => !p.required && !p.disallowed && !p.deprecated);
    const deprecated = role.allProps.filter(p => p.deprecated);
    const prohibited = role.allProps.filter(p => p.disallowed);
    
    if (required.length) {
      output += `\n**Required:**\n${required.map(p => `- ${p.name}`).join('\n')}\n`;
    }
    if (optional.length) {
      output += `\n**Supported:**\n${optional.map(p => `- ${p.name} (${p.is})`).join('\n')}\n`;
    }
    if (deprecated.length) {
      output += `\n**Deprecated:**\n${deprecated.map(p => `- ${p.name}`).join('\n')}\n`;
    }
    if (prohibited.length) {
      output += `\n**Prohibited:**\n${prohibited.map(p => `- ${p.name}`).join('\n')}\n`;
    }
  }
  
  return output;
}

/**
 * Format attribute (state/property) details
 */
function formatAttributeDetails(attr) {
  let output = `## ${attr.name}\n\n`;
  output += `**Type:** ${attr.type}\n`;
  
  if (attr.valueType) {
    output += `**Value Type:** ${attr.valueType}\n`;
  }
  
  if (attr.defaultValue) {
    output += `**Default Value:** ${attr.defaultValue}\n`;
  }
  
  output += `**Global:** ${attr.isGlobal ? 'Yes' : 'No'}\n\n`;
  
  if (attr.description) {
    output += `### Description\n${attr.description}\n\n`;
  }
  
  if (attr.values?.length) {
    output += `### Allowed Values\n${attr.values.map(v => `- \`${v}\``).join('\n')}\n\n`;
  }
  
  if (attr.applicableRoles?.length) {
    output += `**Applicable to Roles:** ${attr.applicableRoles.join(', ')}\n`;
  }
  
  return output;
}

/**
 * Tool definitions for ARIA MCP
 */
export const tools = [
  // ═══════════════════════════════════════════════════════════════════════════
  // ROLE TOOLS
  // ═══════════════════════════════════════════════════════════════════════════
  
  {
    name: 'get-role',
    description: 'Get detailed information about a specific ARIA role including its description, properties, states, required context, and accessibility requirements.',
    inputSchema: {
      type: 'object',
      properties: {
        role: {
          type: 'string',
          description: 'The ARIA role name (e.g., "button", "dialog", "navigation")'
        },
        verbose: {
          type: 'boolean',
          description: 'Include full list of supported states and properties (default: false)'
        }
      },
      required: ['role']
    },
    handler: async (args) => {
      const roleName = args.role.toLowerCase().replace('role:', '').trim();
      const role = data.roles[roleName];
      
      if (!role) {
        // Try to find similar roles
        const similar = Object.keys(data.roles)
          .filter(r => r.includes(roleName) || roleName.includes(r))
          .slice(0, 5);
        
        let msg = `Role "${args.role}" not found.`;
        if (similar.length) {
          msg += ` Did you mean: ${similar.join(', ')}?`;
        }
        return textResponse(msg);
      }
      
      return textResponse(formatRoleDetails(role, args.verbose));
    }
  },
  
  {
    name: 'list-roles',
    description: 'List all ARIA roles, optionally filtered by category. Categories: widget, composite, document, landmark, liveRegion, window, abstract.',
    inputSchema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          description: 'Filter by category',
          enum: ['widget', 'composite', 'document', 'landmark', 'liveRegion', 'window', 'abstract', 'all']
        }
      },
      required: []
    },
    handler: async (args) => {
      const category = args.category || 'all';
      
      if (category === 'all') {
        let output = '# All ARIA Roles by Category\n\n';
        
        Object.entries(data.roleCategories).forEach(([cat, roles]) => {
          if (roles.length) {
            output += `## ${cat.charAt(0).toUpperCase() + cat.slice(1)} Roles (${roles.length})\n`;
            output += roles.sort().map(r => `- ${r}`).join('\n') + '\n\n';
          }
        });
        
        return textResponse(output);
      }
      
      const roles = data.roleCategories[category];
      if (!roles) {
        return textResponse(`Invalid category "${category}". Valid categories: widget, composite, document, landmark, liveRegion, window, abstract`);
      }
      
      return textResponse(
        `# ${category.charAt(0).toUpperCase() + category.slice(1)} Roles (${roles.length})\n\n` +
        roles.sort().map(r => {
          const role = data.roles[r];
          return `- **${r}**: ${role?.description?.substring(0, 100)}...`;
        }).join('\n')
      );
    }
  },
  
  {
    name: 'search-roles',
    description: 'Search for ARIA roles by keyword in their name or description.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search term to find in role names or descriptions'
        }
      },
      required: ['query']
    },
    handler: async (args) => {
      const query = args.query.toLowerCase();
      
      const matches = Object.values(data.roles).filter(role => 
        role.name.toLowerCase().includes(query) ||
        role.description?.toLowerCase().includes(query)
      );
      
      if (!matches.length) {
        return textResponse(`No roles found matching "${args.query}".`);
      }
      
      return textResponse(
        `# Roles matching "${args.query}" (${matches.length})\n\n` +
        matches.map(r => `- **${r.name}** (${r.category}): ${r.description?.substring(0, 150)}...`).join('\n\n')
      );
    }
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // STATE & PROPERTY TOOLS
  // ═══════════════════════════════════════════════════════════════════════════
  
  {
    name: 'get-attribute',
    description: 'Get detailed information about an ARIA state or property (e.g., aria-label, aria-expanded, aria-hidden).',
    inputSchema: {
      type: 'object',
      properties: {
        attribute: {
          type: 'string',
          description: 'The ARIA attribute name (e.g., "aria-label", "aria-expanded")'
        }
      },
      required: ['attribute']
    },
    handler: async (args) => {
      let attrName = args.attribute.toLowerCase().trim();
      
      // Normalize the attribute name
      if (!attrName.startsWith('aria-')) {
        attrName = 'aria-' + attrName;
      }
      
      const attr = data.states[attrName] || data.properties[attrName];
      
      if (!attr) {
        const allAttrs = [...Object.keys(data.states), ...Object.keys(data.properties)];
        const similar = allAttrs.filter(a => a.includes(attrName) || attrName.includes(a)).slice(0, 5);
        
        let msg = `Attribute "${args.attribute}" not found.`;
        if (similar.length) {
          msg += ` Did you mean: ${similar.join(', ')}?`;
        }
        return textResponse(msg);
      }
      
      return textResponse(formatAttributeDetails(attr));
    }
  },
  
  {
    name: 'list-states',
    description: 'List all ARIA states with their descriptions.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    },
    handler: async () => {
      const states = Object.values(data.states);
      
      return textResponse(
        `# ARIA States (${states.length})\n\n` +
        `States reflect dynamic conditions that change based on user interaction.\n\n` +
        states.map(s => `- **${s.name}**: ${s.description?.substring(0, 100)}...`).join('\n\n')
      );
    }
  },
  
  {
    name: 'list-properties',
    description: 'List all ARIA properties. Optionally filter to show only global properties.',
    inputSchema: {
      type: 'object',
      properties: {
        global: {
          type: 'boolean',
          description: 'Only show global properties that apply to all elements'
        }
      },
      required: []
    },
    handler: async (args) => {
      let properties = Object.values(data.properties);
      
      if (args.global) {
        properties = properties.filter(p => p.isGlobal);
      }
      
      const title = args.global ? 'Global ARIA Properties' : 'All ARIA Properties';
      
      return textResponse(
        `# ${title} (${properties.length})\n\n` +
        properties.map(p => `- **${p.name}**${p.isGlobal ? ' (global)' : ''}: ${p.description?.substring(0, 100)}...`).join('\n\n')
      );
    }
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // VALIDATION & GUIDANCE TOOLS
  // ═══════════════════════════════════════════════════════════════════════════
  
  {
    name: 'validate-role-attributes',
    description: 'Validate which ARIA attributes are allowed, required, or prohibited for a specific role.',
    inputSchema: {
      type: 'object',
      properties: {
        role: {
          type: 'string',
          description: 'The ARIA role to validate against'
        },
        attributes: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of ARIA attributes to validate (e.g., ["aria-label", "aria-expanded"])'
        }
      },
      required: ['role', 'attributes']
    },
    handler: async (args) => {
      const roleName = args.role.toLowerCase();
      const role = data.roles[roleName];
      
      if (!role) {
        return textResponse(`Role "${args.role}" not found.`);
      }
      
      const results = [];
      const allProps = role.allProps || [];
      
      for (const attr of args.attributes) {
        let attrName = attr.toLowerCase().trim();
        if (!attrName.startsWith('aria-')) {
          attrName = 'aria-' + attrName;
        }
        
        const prop = allProps.find(p => p.name === attrName);
        
        if (!prop) {
          results.push(`- ⚠️ **${attrName}**: Not applicable to this role`);
        } else if (prop.required) {
          results.push(`- ✅ **${attrName}**: Required`);
        } else if (prop.disallowed) {
          results.push(`- ❌ **${attrName}**: Prohibited`);
        } else if (prop.deprecated) {
          results.push(`- ⚠️ **${attrName}**: Deprecated`);
        } else {
          results.push(`- ✅ **${attrName}**: Supported`);
        }
      }
      
      return textResponse(
        `# Attribute Validation for role="${roleName}"\n\n` +
        results.join('\n')
      );
    }
  },
  
  {
    name: 'get-required-attributes',
    description: 'Get all required ARIA attributes for a specific role.',
    inputSchema: {
      type: 'object',
      properties: {
        role: {
          type: 'string',
          description: 'The ARIA role name'
        }
      },
      required: ['role']
    },
    handler: async (args) => {
      const roleName = args.role.toLowerCase();
      const role = data.roles[roleName];
      
      if (!role) {
        return textResponse(`Role "${args.role}" not found.`);
      }
      
      const required = (role.allProps || []).filter(p => p.required);
      
      if (!required.length) {
        return textResponse(`# Required Attributes for role="${roleName}"\n\nNo ARIA attributes are required for this role.\n\nHowever, the role ${role.accessibleNameRequired ? '**does require**' : 'does not require'} an accessible name.`);
      }
      
      return textResponse(
        `# Required Attributes for role="${roleName}"\n\n` +
        required.map(p => `- **${p.name}** (${p.is})`).join('\n') +
        `\n\nAccessible Name Required: ${role.accessibleNameRequired ? 'Yes' : 'No'}`
      );
    }
  },
  
  {
    name: 'get-prohibited-attributes',
    description: 'Get all prohibited ARIA attributes for a specific role.',
    inputSchema: {
      type: 'object',
      properties: {
        role: {
          type: 'string',
          description: 'The ARIA role name'
        }
      },
      required: ['role']
    },
    handler: async (args) => {
      const roleName = args.role.toLowerCase();
      const role = data.roles[roleName];
      
      if (!role) {
        return textResponse(`Role "${args.role}" not found.`);
      }
      
      const prohibited = (role.allProps || []).filter(p => p.disallowed);
      
      if (!prohibited.length) {
        return textResponse(`# Prohibited Attributes for role="${roleName}"\n\nNo ARIA attributes are prohibited for this role.`);
      }
      
      return textResponse(
        `# Prohibited Attributes for role="${roleName}"\n\n` +
        `The following attributes MUST NOT be used with this role:\n\n` +
        prohibited.map(p => `- **${p.name}**`).join('\n')
      );
    }
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // ROLE RELATIONSHIP TOOLS
  // ═══════════════════════════════════════════════════════════════════════════
  
  {
    name: 'get-role-hierarchy',
    description: 'Get the inheritance hierarchy for a role, showing parent and child roles.',
    inputSchema: {
      type: 'object',
      properties: {
        role: {
          type: 'string',
          description: 'The ARIA role name'
        }
      },
      required: ['role']
    },
    handler: async (args) => {
      const roleName = args.role.toLowerCase();
      const role = data.roles[roleName];
      
      if (!role) {
        return textResponse(`Role "${args.role}" not found.`);
      }
      
      let output = `# Role Hierarchy for "${roleName}"\n\n`;
      
      // Build ancestry chain
      const ancestors = [];
      let current = role;
      while (current?.superclassRoles?.length) {
        const parentName = current.superclassRoles[0];
        ancestors.unshift(parentName);
        current = data.roles[parentName];
      }
      
      if (ancestors.length) {
        output += `## Inheritance Chain\n`;
        output += ancestors.map((a, i) => '  '.repeat(i) + `└── ${a}`).join('\n');
        output += '\n' + '  '.repeat(ancestors.length) + `└── **${roleName}** (current)\n\n`;
      }
      
      if (role.superclassRoles?.length) {
        output += `**Direct Superclass Roles:** ${role.superclassRoles.join(', ')}\n`;
      }
      
      if (role.subclassRoles?.length) {
        output += `**Direct Subclass Roles:** ${role.subclassRoles.join(', ')}\n`;
      }
      
      return textResponse(output);
    }
  },
  
  {
    name: 'get-required-context',
    description: 'Get the required parent context for a role (e.g., listitem requires list or group).',
    inputSchema: {
      type: 'object',
      properties: {
        role: {
          type: 'string',
          description: 'The ARIA role name'
        }
      },
      required: ['role']
    },
    handler: async (args) => {
      const roleName = args.role.toLowerCase();
      const role = data.roles[roleName];
      
      if (!role) {
        return textResponse(`Role "${args.role}" not found.`);
      }
      
      if (!role.requiredContextRole?.length) {
        return textResponse(`# Required Context for role="${roleName}"\n\nThis role has no required parent context. It can be used anywhere in the document.`);
      }
      
      return textResponse(
        `# Required Context for role="${roleName}"\n\n` +
        `This role MUST be contained within an element with one of these roles:\n\n` +
        role.requiredContextRole.map(r => `- **${r}**`).join('\n')
      );
    }
  },
  
  {
    name: 'get-required-owned',
    description: 'Get the required child elements for a role (e.g., list requires listitem).',
    inputSchema: {
      type: 'object',
      properties: {
        role: {
          type: 'string',
          description: 'The ARIA role name'
        }
      },
      required: ['role']
    },
    handler: async (args) => {
      const roleName = args.role.toLowerCase();
      const role = data.roles[roleName];
      
      if (!role) {
        return textResponse(`Role "${args.role}" not found.`);
      }
      
      if (!role.requiredOwnedElements?.length) {
        return textResponse(`# Required Owned Elements for role="${roleName}"\n\nThis role has no required child elements.`);
      }
      
      return textResponse(
        `# Required Owned Elements for role="${roleName}"\n\n` +
        `This role MUST contain elements with one of these roles:\n\n` +
        role.requiredOwnedElements.map(r => `- **${r}**`).join('\n')
      );
    }
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // ACCESSIBLE NAME TOOLS
  // ═══════════════════════════════════════════════════════════════════════════
  
  {
    name: 'check-name-requirements',
    description: 'Check if a role requires an accessible name and how it can be provided.',
    inputSchema: {
      type: 'object',
      properties: {
        role: {
          type: 'string',
          description: 'The ARIA role name'
        }
      },
      required: ['role']
    },
    handler: async (args) => {
      const roleName = args.role.toLowerCase();
      const role = data.roles[roleName];
      
      if (!role) {
        return textResponse(`Role "${args.role}" not found.`);
      }
      
      let output = `# Accessible Name for role="${roleName}"\n\n`;
      output += `**Required:** ${role.accessibleNameRequired ? 'Yes' : 'No'}\n`;
      output += `**Name From:** ${role.nameFrom?.join(', ') || 'Not specified'}\n\n`;
      
      if (role.nameFrom?.includes('author')) {
        output += `### Providing a Name (Author)\n`;
        output += `- \`aria-label\`: Provide the name directly\n`;
        output += `- \`aria-labelledby\`: Reference another element's content\n`;
        output += `- Native HTML labeling (for applicable elements)\n\n`;
      }
      
      if (role.nameFrom?.includes('contents')) {
        output += `### Name From Contents\n`;
        output += `The accessible name can be computed from the element's text content.\n\n`;
      }
      
      if (role.childrenPresentational) {
        output += `⚠️ **Note:** Children are presentational - their semantics are hidden from assistive technology.\n`;
      }
      
      return textResponse(output);
    }
  },
  
  {
    name: 'get-roles-requiring-name',
    description: 'List all roles that require an accessible name.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    },
    handler: async () => {
      const rolesWithName = Object.values(data.roles)
        .filter(r => r.accessibleNameRequired)
        .sort((a, b) => a.name.localeCompare(b.name));
      
      return textResponse(
        `# Roles Requiring an Accessible Name (${rolesWithName.length})\n\n` +
        rolesWithName.map(r => `- **${r.name}** (${r.category})`).join('\n')
      );
    }
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // LANDMARK TOOLS
  // ═══════════════════════════════════════════════════════════════════════════
  
  {
    name: 'list-landmarks',
    description: 'List all ARIA landmark roles with guidance on their proper usage.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    },
    handler: async () => {
      const landmarks = data.roleCategories.landmark || [];
      
      let output = `# ARIA Landmark Roles (${landmarks.length})\n\n`;
      output += `Landmarks help assistive technology users navigate and understand page structure.\n\n`;
      
      landmarks.sort().forEach(name => {
        const role = data.roles[name];
        output += `## ${name}\n`;
        output += role?.description?.substring(0, 300) + '...\n\n';
      });
      
      output += `## Best Practices\n`;
      output += `- Use landmarks to define major sections of your page\n`;
      output += `- Ensure each landmark is unique or has a unique label\n`;
      output += `- Don't overuse landmarks - they should represent significant regions\n`;
      output += `- The \`main\` landmark should appear only once per page\n`;
      
      return textResponse(output);
    }
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // WIDGET & INTERACTION TOOLS
  // ═══════════════════════════════════════════════════════════════════════════
  
  {
    name: 'list-widget-roles',
    description: 'List all interactive widget roles that represent user interface controls.',
    inputSchema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          description: 'Filter by widget type',
          enum: ['simple', 'composite', 'all']
        }
      },
      required: []
    },
    handler: async (args) => {
      const type = args.type || 'all';
      
      let roles = [];
      if (type === 'all' || type === 'simple') {
        roles = roles.concat(data.roleCategories.widget || []);
      }
      if (type === 'all' || type === 'composite') {
        roles = roles.concat(data.roleCategories.composite || []);
      }
      
      const title = type === 'composite' ? 'Composite Widget Roles' : 
                    type === 'simple' ? 'Simple Widget Roles' : 
                    'All Widget Roles';
      
      return textResponse(
        `# ${title} (${roles.length})\n\n` +
        roles.sort().map(name => {
          const role = data.roles[name];
          return `- **${name}**: ${role?.description?.substring(0, 100)}...`;
        }).join('\n\n')
      );
    }
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // LIVE REGION TOOLS
  // ═══════════════════════════════════════════════════════════════════════════
  
  {
    name: 'list-live-regions',
    description: 'List all ARIA live region roles and explain their politeness levels.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    },
    handler: async () => {
      const liveRegions = data.roleCategories.liveRegion || [];
      
      let output = `# ARIA Live Region Roles (${liveRegions.length})\n\n`;
      output += `Live regions announce dynamic content changes to assistive technology users.\n\n`;
      
      liveRegions.sort().forEach(name => {
        const role = data.roles[name];
        output += `## ${name}\n`;
        output += role?.description?.substring(0, 400) + '\n\n';
      });
      
      output += `## aria-live Politeness Levels\n\n`;
      output += `- **off**: Updates are not announced\n`;
      output += `- **polite**: Updates are announced at the next graceful opportunity\n`;
      output += `- **assertive**: Updates are announced immediately, interrupting the user\n\n`;
      output += `## Best Practices\n`;
      output += `- Use \`alert\` for important, time-sensitive messages\n`;
      output += `- Use \`status\` for advisory information\n`;
      output += `- Avoid excessive live region announcements\n`;
      
      return textResponse(output);
    }
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // SPEC INFORMATION TOOLS
  // ═══════════════════════════════════════════════════════════════════════════
  
  {
    name: 'get-aria-version',
    description: 'Get information about the ARIA specification version and metadata.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    },
    handler: async () => {
      const meta = data.metadata;
      const stats = {
        roles: Object.keys(data.roles).length,
        states: Object.keys(data.states).length,
        properties: Object.keys(data.properties).length,
        globalAttributes: data.globalStatesAndProperties?.length || 0,
      };
      
      return textResponse(
        `# ARIA Specification Information\n\n` +
        `**Version:** WAI-ARIA ${meta.version}\n` +
        `**Specification URL:** ${meta.specUrl}\n` +
        `**Source Repository:** ${meta.sourceUrl}\n` +
        `**Data Generated:** ${meta.generatedAt}\n\n` +
        `## Statistics\n\n` +
        `- **Roles:** ${stats.roles}\n` +
        `- **States:** ${stats.states}\n` +
        `- **Properties:** ${stats.properties}\n` +
        `- **Global Attributes:** ${stats.globalAttributes}\n`
      );
    }
  },
  
  {
    name: 'get-global-attributes',
    description: 'List all global ARIA states and properties that apply to any element.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    },
    handler: async () => {
      const globals = data.globalStatesAndProperties || [];
      
      return textResponse(
        `# Global ARIA States and Properties (${globals.length})\n\n` +
        `These attributes can be used on any element, regardless of role:\n\n` +
        globals.map(name => {
          const attr = data.states[name] || data.properties[name];
          const type = attr?.type || 'attribute';
          return `- **${name}** (${type})`;
        }).join('\n')
      );
    }
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // GUIDANCE & BEST PRACTICES
  // ═══════════════════════════════════════════════════════════════════════════
  
  {
    name: 'suggest-role',
    description: 'Suggest appropriate ARIA roles based on a description of the UI component.',
    inputSchema: {
      type: 'object',
      properties: {
        description: {
          type: 'string',
          description: 'Description of the UI component (e.g., "dropdown menu", "modal dialog", "tab interface")'
        }
      },
      required: ['description']
    },
    handler: async (args) => {
      const desc = args.description.toLowerCase();
      const suggestions = [];
      
      // Common patterns
      const patterns = [
        { keywords: ['button', 'click', 'action', 'submit'], roles: ['button'] },
        { keywords: ['link', 'navigate', 'anchor'], roles: ['link'] },
        { keywords: ['checkbox', 'toggle', 'check'], roles: ['checkbox', 'switch'] },
        { keywords: ['radio', 'select one', 'mutually exclusive'], roles: ['radio', 'radiogroup'] },
        { keywords: ['dropdown', 'select', 'combobox', 'autocomplete'], roles: ['combobox', 'listbox'] },
        { keywords: ['menu', 'context menu', 'popup menu'], roles: ['menu', 'menubar', 'menuitem'] },
        { keywords: ['tab', 'tabs', 'tabbed'], roles: ['tablist', 'tab', 'tabpanel'] },
        { keywords: ['dialog', 'modal', 'popup', 'overlay'], roles: ['dialog', 'alertdialog'] },
        { keywords: ['alert', 'notification', 'message'], roles: ['alert', 'status'] },
        { keywords: ['navigation', 'nav', 'menu bar'], roles: ['navigation', 'menubar'] },
        { keywords: ['tree', 'hierarchical', 'expand collapse'], roles: ['tree', 'treeitem'] },
        { keywords: ['grid', 'spreadsheet', 'data grid'], roles: ['grid', 'gridcell'] },
        { keywords: ['table', 'data table'], roles: ['table', 'row', 'cell'] },
        { keywords: ['list', 'items'], roles: ['list', 'listitem'] },
        { keywords: ['slider', 'range', 'volume'], roles: ['slider'] },
        { keywords: ['progress', 'loading', 'percentage'], roles: ['progressbar'] },
        { keywords: ['tooltip', 'hint', 'help text'], roles: ['tooltip'] },
        { keywords: ['search', 'search box'], roles: ['search', 'searchbox'] },
        { keywords: ['banner', 'header', 'masthead'], roles: ['banner'] },
        { keywords: ['footer', 'content info'], roles: ['contentinfo'] },
        { keywords: ['main', 'primary content'], roles: ['main'] },
        { keywords: ['sidebar', 'aside', 'complementary'], roles: ['complementary'] },
        { keywords: ['form', 'input form'], roles: ['form'] },
        { keywords: ['text input', 'text field', 'textbox'], roles: ['textbox'] },
        { keywords: ['heading', 'title', 'section header'], roles: ['heading'] },
        { keywords: ['image', 'picture', 'graphic'], roles: ['img'] },
        { keywords: ['article', 'blog post', 'news item'], roles: ['article'] },
        { keywords: ['feed', 'stream', 'infinite scroll'], roles: ['feed'] },
      ];
      
      patterns.forEach(pattern => {
        if (pattern.keywords.some(k => desc.includes(k))) {
          suggestions.push(...pattern.roles);
        }
      });
      
      // Remove duplicates
      const unique = [...new Set(suggestions)];
      
      if (!unique.length) {
        return textResponse(
          `No specific role suggestions for "${args.description}".\n\n` +
          `Try describing the component's behavior (e.g., "clickable button", "expandable tree", "modal dialog").\n\n` +
          `You can also use \`search-roles\` to search by keyword.`
        );
      }
      
      let output = `# Role Suggestions for "${args.description}"\n\n`;
      
      unique.forEach(roleName => {
        const role = data.roles[roleName];
        if (role) {
          output += `## ${roleName}\n`;
          output += role.description?.substring(0, 200) + '...\n\n';
          if (role.accessibleNameRequired) {
            output += `⚠️ Requires accessible name\n\n`;
          }
        }
      });
      
      return textResponse(output);
    }
  },
  
  {
    name: 'get-server-info',
    description: 'Returns information about this MCP server.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    },
    handler: async () => {
      const info = data.serverInfo;
      const toolCount = tools.length;
      
      return textResponse(
        `# ${info.name} v${info.version}\n\n` +
        `${info.description}\n\n` +
        `## Available Tools (${toolCount})\n\n` +
        `This server provides comprehensive access to the WAI-ARIA specification including:\n\n` +
        `- **Role Information:** Look up roles, their requirements, and hierarchies\n` +
        `- **State & Property Details:** Understand ARIA attributes and their usage\n` +
        `- **Validation:** Check if attributes are valid for specific roles\n` +
        `- **Guidance:** Get suggestions for appropriate roles and best practices\n` +
        `- **Landmark & Widget Roles:** Specialized queries for common patterns\n\n` +
        `Use \`get-aria-version\` for specification metadata.`
      );
    }
  }
];
