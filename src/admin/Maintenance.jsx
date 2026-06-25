import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

function Maintenance() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Maintenance</h1>
        <p className="text-sm text-muted-foreground">Handle maintenance requests and work orders</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Maintenance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-64 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
            Maintenance view — coming soon. Share the design screenshot to build this out.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Maintenance
