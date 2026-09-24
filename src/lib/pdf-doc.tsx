import {
  Document,
  Font,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import {
  longDate,
  pdfFilename,
  SHEET,
  totalItems,
  type SheetGroup,
} from "@/lib/format";

// Built-in PDF faces keep the file self-contained; Times-Italic stands in for the
// handwritten margin notes on the printed sheet.
Font.registerHyphenationCallback((word) => [word]);

const styles = StyleSheet.create({
  page: { backgroundColor: SHEET.page, fontFamily: "Helvetica", color: SHEET.ink },
  marginNote: {
    position: "absolute",
    fontFamily: "Times-Italic",
    fontSize: 11,
    lineHeight: 1.15,
    color: SHEET.forest,
  },
  title: {
    fontFamily: "Helvetica-Bold",
    fontSize: 27,
    letterSpacing: 0.6,
    color: SHEET.forest,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 6.6,
    letterSpacing: 2.1,
    color: SHEET.mute,
    textAlign: "center",
    fontFamily: "Helvetica-Bold",
    marginTop: 5,
  },
  pill: {
    marginTop: 11,
    alignSelf: "center",
    backgroundColor: SHEET.peach,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  card: {
    width: "48.5%",
    marginBottom: 11,
    borderRadius: 10,
    borderWidth: 0.6,
    borderColor: "#E4DDCE",
    backgroundColor: SHEET.surface,
    overflow: "hidden",
  },
  cardHead: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingVertical: 5,
    borderBottomWidth: 0.5,
    borderBottomStyle: "dotted",
    borderBottomColor: "#DCD5C6",
  },
});

function Sheet({ groups, notes, date, title }: { groups: SheetGroup[]; notes: string; date: Date; title: string }) {
  const items = totalItems(groups);
  const columns: SheetGroup[][] = [[], []];
  groups.forEach((g, i) => columns[i % 2].push(g));

  return (
    <Page size="A4" style={styles.page}>
      {/* handwritten margin notes */}
      <View style={[styles.marginNote, { left: 14, top: 22, transform: "rotate(-6deg)" }]}>
        <Text>Good</Text>
        <Text>Food</Text>
        <Text>Happier</Text>
        <Text>Days ♥</Text>
      </View>
      <View style={[styles.marginNote, { right: 18, top: 24, transform: "rotate(4deg)", textAlign: "right" }]}>
        <Text>Plan it</Text>
        <Text>Shop it</Text>
        <Text>Live it</Text>
      </View>

      {/* masthead */}
      <View style={{ marginTop: 26, paddingHorizontal: 58 }}>
        <Text style={{ textAlign: "center", fontSize: 15, color: SHEET.clay }}>⌂ ♥</Text>
        <Text style={styles.title}>{title.toUpperCase()}</Text>
        <Text style={styles.subtitle}>HOME ESSENTIALS FOR A BETTER TOMORROW</Text>
      </View>

      {/* meta */}
      <View style={styles.pill}>
        <Text style={{ fontSize: 8.5, color: SHEET.forest }}>{longDate(date)}</Text>
        <Text style={{ fontSize: 8.5, color: SHEET.forest, marginLeft: 10 }}>
          |  {items} items · {groups.length} categories
        </Text>
      </View>

      {/* category blocks, two columns */}
      <View style={{ marginTop: 14, paddingHorizontal: 30, flexDirection: "row", justifyContent: "space-between" }}>
        {columns.map((column, ci) => (
          <View key={ci} style={{ width: "48.5%" }}>
            {column.map((group) => (
              <View key={group.name} style={[styles.card, { width: "100%" }]} wrap={false}>
                <View style={[styles.cardHead, { backgroundColor: group.tint }]}>
                  <Text
                    style={{
                      fontFamily: "Helvetica-Bold",
                      fontSize: 9.5,
                      color: SHEET.forest,
                      letterSpacing: 0.4,
                      textTransform: "uppercase",
                    }}
                  >
                    {group.name}
                  </Text>
                  <Text style={{ fontSize: 7, color: SHEET.mute, marginLeft: 8 }}>
                    {group.items.length} items
                  </Text>
                </View>
                <View style={{ paddingHorizontal: 10, paddingBottom: 6, paddingTop: 2 }}>
                  {group.items.map((item, i) => (
                    <View
                      key={item.name}
                      style={[styles.row, i === group.items.length - 1 ? { borderBottomWidth: 0 } : {}]}
                    >
                      <Text style={{ fontSize: 8, marginRight: 7, marginBottom: 1 }}>□</Text>
                      <Text style={{ fontSize: 8.5, maxWidth: 150 }}>{item.name}</Text>
                      <Text style={{ fontSize: 8.5, marginLeft: "auto" }}>
                        {item.quantity} {item.unit}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        ))}
      </View>

      {/* notes */}
      <View style={{ paddingHorizontal: 30, flexDirection: "row" }}>
        <View
          style={{
            width: "73%",
            borderRadius: 10,
            borderWidth: 0.6,
            borderColor: "#E4DDCE",
            backgroundColor: SHEET.surface,
            padding: 10,
          }}
        >
          <Text
            style={{
              fontFamily: "Helvetica-Bold",
              fontSize: 8,
              letterSpacing: 1.2,
              color: SHEET.forest,
            }}
          >
            NOTES
          </Text>
          <View style={{ marginTop: 6 }}>
            {[0, 1, 2].map((i) => (
              <View
                key={i}
                style={{
                  borderBottomWidth: 0.5,
                  borderBottomColor: "#DCD5C6",
                  paddingBottom: 4,
                  marginBottom: 9,
                }}
              >
                {i === 0 && notes ? (
                  <Text style={{ fontFamily: "Times-Italic", fontSize: 10, color: SHEET.forest }}>{notes}</Text>
                ) : null}
              </View>
            ))}
          </View>
        </View>
        <View style={{ flex: 1, paddingLeft: 12, paddingTop: 14 }}>
          <Text style={{ fontFamily: "Times-Italic", fontSize: 11, color: SHEET.forest, lineHeight: 1.15 }}>
            Good Things{"\n"}for Brighter{"\n"}Days ♥
          </Text>
        </View>
      </View>

      {/* footer */}
      <View
        fixed
        style={{
          position: "absolute",
          left: 30,
          right: 30,
          bottom: 20,
          borderTopWidth: 0.6,
          borderTopColor: "#E1DACB",
          paddingTop: 5,
        }}
      >
        <Text style={{ fontSize: 7, color: SHEET.mute, textAlign: "center" }}>
          Made with ♥ HomeList  ·  A simpler home. A smarter you.
        </Text>
      </View>
    </Page>
  );
}

export function SheetDocument(props: { groups: SheetGroup[]; notes: string; date: Date; title: string }) {
  return <Document title="Household Shopping List" author="HomeList">{<Sheet {...props} />}</Document>;
}

/** Builds the PDF blob client-side and returns it with its filename. */
export async function makePdfFile(props: {
  groups: SheetGroup[];
  notes: string;
  date: Date;
  title: string;
}) {
  const { pdf } = await import("@react-pdf/renderer");
  const blob = await pdf(<SheetDocument {...props} />).toBlob();
  const bytes = Math.max(1, Math.round(blob.size / 1024));
  return { blob, filename: pdfFilename(props.date), kilobytes: bytes };
}
