import LiquidMesh from './LiquidMesh';import ParticleField from './ParticleField';import FloatingLights from './FloatingLights';
export default function AuroraBackground(){return <div className="aurora-environment" aria-hidden="true"><div className="aurora aurora-one"/><div className="aurora aurora-two"/><div className="ambient-grid"/><LiquidMesh/><ParticleField/><FloatingLights/></div>;}
