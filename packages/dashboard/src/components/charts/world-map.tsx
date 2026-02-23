"use client";

import { memo, useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from "react-simple-maps";

// TopoJSON world atlas - lightweight, no API key needed
const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// ISO 3166-1 alpha-2 to numeric mapping (react-simple-maps uses numeric IDs from Natural Earth)
// This maps our 2-letter country codes to the ISO numeric codes used in the TopoJSON
const ALPHA2_TO_NUMERIC: Record<string, string> = {
  AF:"004",AL:"008",DZ:"012",AS:"016",AD:"020",AO:"024",AG:"028",AR:"032",
  AM:"051",AU:"036",AT:"040",AZ:"031",BS:"044",BH:"048",BD:"050",BB:"052",
  BY:"112",BE:"056",BZ:"084",BJ:"204",BT:"064",BO:"068",BA:"070",BW:"072",
  BR:"076",BN:"096",BG:"100",BF:"854",BI:"108",KH:"116",CM:"120",CA:"124",
  CV:"132",CF:"140",TD:"148",CL:"152",CN:"156",CO:"170",KM:"174",CG:"178",
  CD:"180",CR:"188",CI:"384",HR:"191",CU:"192",CY:"196",CZ:"203",DK:"208",
  DJ:"262",DM:"212",DO:"214",EC:"218",EG:"818",SV:"222",GQ:"226",ER:"232",
  EE:"233",SZ:"748",ET:"231",FJ:"242",FI:"246",FR:"250",GA:"266",GM:"270",
  GE:"268",DE:"276",GH:"288",GR:"300",GD:"308",GT:"320",GN:"324",GW:"624",
  GY:"328",HT:"332",HN:"340",HU:"348",IS:"352",IN:"356",ID:"360",IR:"364",
  IQ:"368",IE:"372",IL:"376",IT:"380",JM:"388",JP:"392",JO:"400",KZ:"398",
  KE:"404",KI:"296",KP:"408",KR:"410",KW:"414",KG:"417",LA:"418",LV:"428",
  LB:"422",LS:"426",LR:"430",LY:"434",LI:"438",LT:"440",LU:"442",MG:"450",
  MW:"454",MY:"458",MV:"462",ML:"466",MT:"470",MH:"584",MR:"478",MU:"480",
  MX:"484",FM:"583",MD:"498",MC:"492",MN:"496",ME:"499",MA:"504",MZ:"508",
  MM:"104",NA:"516",NR:"520",NP:"524",NL:"528",NZ:"554",NI:"558",NE:"562",
  NG:"566",MK:"807",NO:"578",OM:"512",PK:"586",PW:"585",PA:"591",PG:"598",
  PY:"600",PE:"604",PH:"608",PL:"616",PT:"620",QA:"634",RO:"642",RU:"643",
  RW:"646",KN:"659",LC:"662",VC:"670",WS:"882",SM:"674",ST:"678",SA:"682",
  SN:"686",RS:"688",SC:"690",SL:"694",SG:"702",SK:"703",SI:"705",SB:"090",
  SO:"706",ZA:"710",SS:"728",ES:"724",LK:"144",SD:"729",SR:"740",SE:"752",
  CH:"756",SY:"760",TW:"158",TJ:"762",TZ:"834",TH:"764",TL:"626",TG:"768",
  TO:"776",TT:"780",TN:"788",TR:"792",TM:"795",TV:"798",UG:"800",UA:"804",
  AE:"784",GB:"826",US:"840",UY:"858",UZ:"860",VU:"548",VE:"862",VN:"704",
  YE:"887",ZM:"894",ZW:"716",XK:"-99",
};

interface WorldMapProps {
  data: Record<string, number>; // country code -> visitor count
  maxValue: number;
}

function WorldMapInner({ data, maxValue }: WorldMapProps) {
  const [tooltip, setTooltip] = useState<{
    name: string;
    code: string;
    value: number;
    x: number;
    y: number;
  } | null>(null);

  // Build reverse lookup: numeric ID -> alpha2 code
  const numericToAlpha2: Record<string, string> = {};
  for (const [a2, num] of Object.entries(ALPHA2_TO_NUMERIC)) {
    numericToAlpha2[num] = a2;
  }

  function getColour(count: number): string {
    if (count === 0) return "hsl(var(--muted))";
    // Logarithmic scale for better colour distribution
    const intensity = Math.log(count + 1) / Math.log(maxValue + 1);
    const alpha = 0.15 + intensity * 0.75;
    return `rgba(16, 185, 129, ${alpha})`; // emerald-500
  }

  return (
    <div className="relative">
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          scale: 130,
          center: [10, 20],
        }}
        height={380}
        style={{ width: "100%", height: "auto" }}
      >
        <ZoomableGroup>
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const numericId = geo.id;
                const alpha2 = numericToAlpha2[numericId] || "";
                const count = data[alpha2] || 0;

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={getColour(count)}
                    stroke="hsl(var(--border))"
                    strokeWidth={0.5}
                    style={{
                      default: { outline: "none" },
                      hover: {
                        outline: "none",
                        fill: count > 0
                          ? "rgba(16, 185, 129, 0.9)"
                          : "hsl(var(--accent))",
                        cursor: "pointer",
                      },
                      pressed: { outline: "none" },
                    }}
                    onMouseEnter={(evt) => {
                      const name = geo.properties.name || alpha2;
                      setTooltip({
                        name,
                        code: alpha2,
                        value: count,
                        x: evt.clientX,
                        y: evt.clientY,
                      });
                    }}
                    onMouseLeave={() => setTooltip(null)}
                  />
                );
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>

      {tooltip && (
        <div
          className="fixed z-50 px-3 py-2 rounded-lg border bg-popover text-popover-foreground shadow-lg text-sm pointer-events-none"
          style={{
            left: tooltip.x + 12,
            top: tooltip.y - 10,
          }}
        >
          <div className="font-medium">{tooltip.name}</div>
          <div className="text-muted-foreground text-xs">
            {tooltip.value > 0
              ? `${tooltip.value.toLocaleString()} visitors`
              : "No visitors"}
          </div>
        </div>
      )}
    </div>
  );
}

export const WorldMap = memo(WorldMapInner);
