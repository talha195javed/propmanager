import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

function Lease() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Lease</h1>
        <p className="text-sm text-muted-foreground">Track lease agreements and renewals</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Lease</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-64 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
            Lease view — coming soon. Share the design screenshot to build this out.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Lease
